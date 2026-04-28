import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CalculateTarifDto } from '../presentation/dto/calculate-tarif.dto';
import { tarifsTable } from '../infrastructure/data/tarifsData';
import { azizaStores } from '../infrastructure/data/storesData';
import { flegPricingGrid, flegConfig } from '../infrastructure/data/flegData';
import { diversData } from '../infrastructure/data/diversData';
import { tractageSiteKmRate, tractageVehicleFactor, tractageConfig } from '../infrastructure/data/tractageData';
import { clientDiversZoneTarifs, clientDiversZoneVehiculeTarifs, clientDiversConfig, type ClientDiversVehicleKey } from '../infrastructure/data/clientDiversData';
import { freezerData, type FreezerVehicleKey } from '../infrastructure/data/freezerData';

@Injectable()
export class TarifService {

    public getStores() {
        return azizaStores;
    }

    public calculateTarif(dto: CalculateTarifDto) {
        const { km, palettes, nbMagasins, storeDurations, nature, tourneeType, deliveryTime, stores } = dto;
        const hasStores = Array.isArray(stores) && stores.length > 0;

        if (km == null || (!hasStores && palettes == null) || !nature) {
            throw new BadRequestException('km, palettes et nature sont obligatoires');
        }

        // --- Sector Validation Logic ---
        if (hasStores) {
            const selectedStoreData = stores.map(s => azizaStores.find(db => db.name === s.name));
            const foundStores = selectedStoreData.filter(s => !!s);

            if (foundStores.length > 0) {
                const sectors = new Set(foundStores.map(s => s!.sector));
                const isMultiSector = sectors.size > 1;

                if (nature !== 'Fleg' && nature !== 'Divers' && isMultiSector && tourneeType === 'Generique') {
                    throw new BadRequestException('تنبيه: لا يمكن أن تكون الدورة "Generique" لأن المغازات المحددة تنتمي لقطاعات مختلفة (Sectors). يرجى تغيير نوع الدورة إلى "Non Generique".');
                }
            }
        }
        // ------------------------------

        const storesArray = hasStores
            ? stores.map((s, idx) => ({
                index: idx + 1,
                name: s.name || `Magasin ${idx + 1}`,
                time: s.time || s.duration || null,
                palettes: Number(s.palettes) || 0,
            }))
            : null;

        const totalPalettesFromStores = storesArray
            ? storesArray.reduce((sum, s) => sum + (s.palettes || 0), 0)
            : 0;

        const effectivePalettes = totalPalettesFromStores > 0 ? totalPalettesFromStores : (palettes || 0);

        let tarifRaw = 0;
        let matchedRow: any = null;

        if (nature === 'Fleg') {
            const basePrice = this.getFlegBasePrice(dto.zone, dto.vehicleType);
            tarifRaw = basePrice + (Number(km) * flegConfig.kmRate);
            matchedRow = { Type: 'Fleg', Tarifs: tarifRaw, Zone: dto.zone, Vehicle: dto.vehicleType };
        } else if (nature === 'Divers') {
            const diversResult = this.calculateDiversTarif(dto);
            tarifRaw = diversResult.tarif;
            matchedRow = { Type: 'Divers', Category: dto.diversCategory, SubCategory: dto.diversSubCategory, Details: diversResult.details };
        } else {
            matchedRow = this.findTarifRow({ km, palettes: effectivePalettes, nature });
            if (!matchedRow) {
                throw new NotFoundException('Aucune ligne tarifaire correspondante');
            }
            tarifRaw = Number(matchedRow.Tarifs) || 0;

            const meta = this.getCapacityMeta(matchedRow);
            if (meta) {
                matchedRow = { ...matchedRow, ...meta };
            }
        }

        const tarifUnit = tarifRaw;
        const nbMagasinsNum = storesArray && storesArray.length > 0
            ? storesArray.length
            : Number(nbMagasins) || 0;

        const kmNum = Number(km) || 0;
        const roundTripKm = kmNum;

        const hasMajoration = nature !== 'Fleg' && nature !== 'Divers' && tourneeType === 'Generique' && nbMagasinsNum >= 5;

        const baseRemisePercent = matchedRow?.Type === 'Fleg' ? 0 : this.pickRemise(matchedRow, roundTripKm, { majoration: hasMajoration });

        const effectiveStoreDurations = Array.isArray(storeDurations) && storeDurations.length > 0
            ? storeDurations
            : (storesArray && storesArray.length > 0 ? storesArray.map(s => s.time) : []);

        let applyRemise = false;

        // Rule: Non Generique tours have no remise. Also Fleg has no remise based on tournee type.
        if (nature !== 'Fleg' && nature !== 'Divers' && tourneeType === 'Generique') {
            if (Array.isArray(effectiveStoreDurations) && effectiveStoreDurations.length > 0) {
                for (const t of effectiveStoreDurations) {
                    const minutes = this.timeToMinutes(t);
                    if (minutes != null && minutes >= 16 * 60) {
                        applyRemise = true;
                        break;
                    }
                }
            } else if (deliveryTime) {
                const minutes = this.timeToMinutes(deliveryTime);
                applyRemise = minutes != null && minutes >= 16 * 60;
            }
        }

        let remisePercent = 0;
        let remiseAmount = 0;
        let total = tarifRaw;
        let storesBreakdown: any[] | null = null;

        if (storesArray && storesArray.length > 0) {
            const totalPalettesStores = totalPalettesFromStores > 0 ? totalPalettesFromStores : storesArray.length;

            let totalNet = 0;
            let totalRemiseStores = 0;
            storesBreakdown = [];

            for (const s of storesArray) {
                const storePal = s.palettes || 0;
                const shareRatio = totalPalettesFromStores > 0
                    ? storePal / totalPalettesStores
                    : 1 / storesArray.length;

                const montantBrut = tarifRaw * shareRatio;

                let isLate = false;
                if (tourneeType === 'Generique') {
                    const minutes = this.timeToMinutes(s.time);
                    isLate = minutes != null && minutes >= 16 * 60;
                } else {
                    isLate = applyRemise;
                }

                let storeRemisePercent = 0;
                if (applyRemise && baseRemisePercent > 0) {
                    if (tourneeType === 'Generique') {
                        storeRemisePercent = isLate ? baseRemisePercent : 0;
                    } else {
                        storeRemisePercent = baseRemisePercent;
                    }
                }

                const storeRemiseAmount = montantBrut * storeRemisePercent;
                const montantNet = montantBrut - storeRemiseAmount;

                totalRemiseStores += storeRemiseAmount;
                totalNet += montantNet;

                storesBreakdown.push({
                    index: s.index,
                    name: s.name,
                    time: s.time,
                    palettes: storePal,
                    isLate,
                    remisePercent: storeRemisePercent,
                    remiseAmount: storeRemiseAmount,
                    montantBrut,
                    montantNet,
                });
            }

            remisePercent = applyRemise ? baseRemisePercent : 0;
            remiseAmount = totalRemiseStores;
            total = totalNet > 0 ? totalNet : tarifRaw;
        } else {
            remisePercent = applyRemise ? baseRemisePercent : 0;
            remiseAmount = tarifRaw * remisePercent;
            total = tarifRaw - remiseAmount;

            // If only nbMagasins is provided (no stores details), still return a breakdown.
            // NOTE: not applicable for Divers.
            if (nature !== 'Divers' && nbMagasinsNum > 0) {
                storesBreakdown = [];
                const shareRatio = 1 / nbMagasinsNum;
                for (let i = 0; i < nbMagasinsNum; i += 1) {
                    const montantBrut = tarifRaw * shareRatio;
                    const storeRemisePercent = applyRemise ? baseRemisePercent : 0;
                    const storeRemiseAmount = montantBrut * storeRemisePercent;
                    const montantNet = montantBrut - storeRemiseAmount;

                    storesBreakdown.push({
                        index: i + 1,
                        name: `Magasin ${i + 1}`,
                        time: null,
                        palettes: 0,
                        isLate: applyRemise,
                        remisePercent: storeRemisePercent,
                        remiseAmount: storeRemiseAmount,
                        montantBrut,
                        montantNet,
                    });
                }
            } else {
                storesBreakdown = null;
            }
        }

        const coefficient = totalPalettesFromStores > 0 ? tarifRaw / totalPalettesFromStores : 0;

        return {
            input: dto,
            matchedRow,
            tarifUnit,
            tarifRaw,
            coefficient,
            nbMagasins: nbMagasinsNum,
            hasMajoration,
            remisePercent,
            remiseAmount,
            applyRemise,
            storesBreakdown,
            total,
        };
    }

    private getFlegBasePrice(zone?: string, vehicle?: string): number {
        const prices: Record<string, Record<string, number>> = {
            TUN: { dmax: 50, nkr: 70 },
            BIZ: { dmax: 100, nkr: 130 },
            CAP: { dmax: 110, nkr: 140 },
            SAH: { dmax: 150, nkr: 190 },
            SFAX: { dmax: 200, nkr: 250 },
        };

        const z = zone?.toUpperCase() || 'TUN';
        const v = vehicle?.toLowerCase() || 'dmax';

        return (prices[z] && prices[z][v]) || 50;
    }

    private findTarifRow({ km, palettes, nature }: any) {
        const kmNum = Number(km);
        const palNum = Number(palettes);

        return tarifsTable.find((r: any) => {
            if (r.Type !== nature) return false;

            const distMin = Number(r.DistMin);
            const distMax = Number(r.DistMax);
            const capMin = Number(r.CapMin);
            const capMax = Number(r.CapMax);

            return (
                Number.isFinite(distMin) &&
                Number.isFinite(distMax) &&
                Number.isFinite(capMin) &&
                Number.isFinite(capMax) &&
                kmNum >= distMin &&
                kmNum <= distMax &&
                palNum >= capMin &&
                palNum <= capMax
            );
        });
    }

    private getCapacityMeta(row: any): { Nature?: any; Capcité?: any; R25?: any; R50?: any; R75?: any; R100?: any; R125?: any } | null {
        if (!row) return null;
        const type = row.Type;
        const capMin = Number(row.CapMin);
        const capMax = Number(row.CapMax);
        if (!type || !Number.isFinite(capMin) || !Number.isFinite(capMax)) return null;

        const reference = tarifsTable.find((r: any) => {
            if (r.Type !== type) return false;
            const dMin = Number(r.DistMin);
            const dMax = Number(r.DistMax);
            const cMin = Number(r.CapMin);
            const cMax = Number(r.CapMax);
            return dMin === 1 && dMax === 25 && cMin === capMin && cMax === capMax;
        });

        if (!reference) return null;
        const meta: any = {};
        if (reference.Nature != null) meta.Nature = reference.Nature;
        if (reference['Capcité'] != null) meta['Capcité'] = reference['Capcité'];
        if (reference.R25 != null) meta.R25 = reference.R25;
        if (reference.R50 != null) meta.R50 = reference.R50;
        if (reference.R75 != null) meta.R75 = reference.R75;
        if (reference.R100 != null) meta.R100 = reference.R100;
        if (reference.R125 != null) meta.R125 = reference.R125;
        return Object.keys(meta).length > 0 ? meta : null;
    }

    private computeRemiseKeys(roundTripKm: number, { majoration = false } = {}): { baseKey: string; key: string | null } {
        let baseKey: string;
        if (roundTripKm <= 25) baseKey = 'R25';
        else if (roundTripKm <= 50) baseKey = 'R50';
        else if (roundTripKm <= 75) baseKey = 'R75';
        else if (roundTripKm <= 100) baseKey = 'R100';
        else baseKey = 'R125';

        let key: string | null = null;
        if (!majoration) key = baseKey;
        else {
            if (baseKey === 'R25') key = 'R50';
            else if (baseKey === 'R50') key = 'R75';
            else if (baseKey === 'R75') key = 'R100';
            else if (baseKey === 'R100') key = 'R125';
            else key = null;
        }

        return { baseKey, key };
    }

    private pickRemise(row: any, roundTripKm: number, { majoration = false } = {}) {
        if (!row || !Number.isFinite(roundTripKm)) return 0;

        const { key } = this.computeRemiseKeys(roundTripKm, { majoration });
        if (!key) return 0;

        let value = row[key];

        if (typeof value !== 'number') {
            const type = row.Type;
            const capMin = Number(row.CapMin);
            const capMax = Number(row.CapMax);

            const fallback = tarifsTable.find((r: any) => {
                if (r.Type !== type) return false;

                const dMin = Number(r.DistMin);
                const dMax = Number(r.DistMax);
                const cMin = Number(r.CapMin);
                const cMax = Number(r.CapMax);

                return (
                    dMin === 1 &&
                    dMax === 25 &&
                    cMin === capMin &&
                    cMax === capMax &&
                    typeof r[key] === 'number'
                );
            });

            if (fallback) {
                value = fallback[key];
            }
        }

        return typeof value === 'number' ? value : 0;
    }

    private timeToMinutes(t: string | undefined | null): number | null {
        if (!t) return null;
        const [hStr, mStr] = String(t).split(':');
        const h = Number(hStr);
        const m = Number(mStr) || 0;
        if (!Number.isFinite(h)) return null;
        return h * 60 + m;
    }

    private calculateDiversTarif(dto: CalculateTarifDto): { tarif: number, details: any } {
        const { diversCategory, diversSubCategory, km = 0, palettes = 0 } = dto;
        const besoinNum = Number(dto.besoin) || 0;
        let finalTarif = 0;
        let details: any = {};

        switch (diversCategory) {

            // ═══════════════════════════════════════════════════════
            // DIVERS AZIZA — tous les sous-types utilisent tarifsData
            // (même grille que Aziza Sec/Froid)
            // ═══════════════════════════════════════════════════════
            case 'diversAziza': {
                const getBaseTarif = () => {
                    const nature = dto.nature === 'Froid' ? 'Froid' : 'Sec';
                    const baseRow = this.findTarifRow({ km, palettes, nature });
                    if (!baseRow) {
                        throw new NotFoundException('Aucune ligne tarifaire Aziza correspondante pour ce km/palettes');
                    }
                    return Number(baseRow.Tarifs) || 0;
                };

                switch (diversSubCategory) {

                    // trp14 — Transfert Technique
                    case 'transfertTechnique':
                        {
                            const kmNum = Number(km) || 0;
                            const brut = besoinNum * kmNum;
                            const remisePercent = dto.hasReturnedGoods ? 0.5 : 0;
                            const remiseAmount = brut * remisePercent;
                            finalTarif = brut - remiseAmount;

                            details = {
                                formula: dto.hasReturnedGoods
                                    ? 'besoin * rayon(km) - 50% (camion revient avec marchandise)'
                                    : 'besoin * rayon(km) (pas de remise)',
                                besoin: besoinNum,
                                km: kmNum,
                                brut,
                                remisePercent,
                                remiseAmount,
                                net: finalTarif,
                            };
                        }
                        break;

                    // trp13 — Transfert Retour
                    case 'transfertRetour':
                        {
                            const zoneKey = typeof dto.zone === 'string' ? dto.zone : '';
                            const zoneTarif = (diversData?.diversAziza?.transfertRetour?.zones as any)?.[zoneKey];
                            const palettesNum = Number(palettes) || 0;

                            if (!zoneKey || !Number.isFinite(Number(zoneTarif))) {
                                throw new BadRequestException('Zone Tarif invalide pour Transfert Retour (trp13).');
                            }

                            const tarifZone = Number(zoneTarif);
                            finalTarif = palettesNum * tarifZone;
                            details = {
                                formula: 'nbr_palettes * tarif_zone',
                                palettes: palettesNum,
                                zone: zoneKey,
                                tarifZone,
                                total: finalTarif,
                            };
                        }
                        break;

                    // trp33 — Tarif Anexe
                    case 'tarifAnexe':
                        {
                            const palettesNum = Number(palettes) || 0;
                            const tarifAnexeNum = Number(dto.tarifAnexe);

                            if (!Number.isFinite(tarifAnexeNum) || tarifAnexeNum <= 0) {
                                throw new BadRequestException('Tarif Annexe invalide (trp33).');
                            }

                            finalTarif = palettesNum * tarifAnexeNum;
                            details = {
                                formula: 'nbr_palettes * tarif_annexe',
                                palettes: palettesNum,
                                tarifAnexe: tarifAnexeNum,
                                total: finalTarif,
                            };
                        }
                        break;

                    // trp10 — Tarif OCT
                    case 'tarifOct':
                        if (dto.isSousseOctBar || dto.isSousseOctMhamdiya) {
                            const baseTarif = getBaseTarif();
                            finalTarif = baseTarif;
                            details = {
                                formula: 'tarif_aziza (OCT Bar/Mhamdiya)',
                                trajet: dto.isSousseOctBar ? 'Sousse → OCT Bar' : 'Sousse → OCT Mhamdiya',
                                baseTarif,
                            };
                            break;
                        }

                        {
                            const zoneKey = typeof dto.zone === 'string' ? dto.zone : '';
                            const zoneTarif = (diversData?.diversAziza?.tarifOct as any)?.zones?.[zoneKey];
                            if (!zoneKey || !Number.isFinite(Number(zoneTarif)) || Number(zoneTarif) <= 0) {
                                throw new BadRequestException('Tarif OCT (trp10): Zone OCT invalide ou tarif non configuré.');
                            }

                            finalTarif = Number(zoneTarif);
                            details = {
                                formula: 'tarif_sucre (fixe) par zone',
                                zone: zoneKey,
                                tarifSucre: finalTarif,
                            };
                        }
                        break;

                    // trp6 — Transport sur Achat
                    case 'transportSurAchat':
                        {
                            const kmNum = Number(km) || 0;
                            const vehicleKeyRaw = typeof dto.vehicleType === 'string' ? dto.vehicleType : '';
                            const vehicleKey = vehicleKeyRaw.toLowerCase();
                            const rate = (diversData?.diversAziza?.transportSurAchat as any)?.tauxKm?.[vehicleKey];

                            if (!Number.isFinite(kmNum) || kmNum <= 0) {
                                throw new BadRequestException('Rayon (km) invalide pour Transport sur Achat (trp6).');
                            }
                            if (vehicleKey !== 'cargo' && vehicleKey !== 'semi') {
                                throw new BadRequestException('Type véhicule invalide pour Transport sur Achat (trp6).');
                            }
                            if (!Number.isFinite(Number(rate)) || Number(rate) <= 0) {
                                throw new BadRequestException('Taux Km non configuré pour Transport sur Achat (trp6).');
                            }

                            const brut = besoinNum * kmNum * Number(rate);
                            finalTarif = brut;
                            details = {
                                formula: 'besoin * km * taux_km(vehicle)',
                                besoin: besoinNum,
                                km: kmNum,
                                vehicleType: vehicleKey,
                                tauxKm: Number(rate),
                                total: finalTarif,
                            };
                        }
                        break;

                    // trp15 — Transfert Inter Dépôt Spot
                    // calcul = rayon(km) * nbr_palettes * taux (cargo/semi)
                    // quand on a 2 cargo => appliquer tarif semi
                    // et chaque transfert 50% remise
                    case 'transfertInterDepotSpot':
                        {
                            const kmNum = Number(km) || 0;
                            const palettesNum = Number(palettes) || 0;
                            const nbCargoNum = Number(dto.nbCargo);
                            const nbCargo = Number.isFinite(nbCargoNum) && nbCargoNum > 0 ? nbCargoNum : 1;

                            const explicitVehicleRaw = typeof dto.vehicleType === 'string' ? dto.vehicleType : '';
                            const explicitVehicle = explicitVehicleRaw.toLowerCase();

                            const effectiveVehicle = explicitVehicle === 'semi' || nbCargo >= 2 ? 'semi' : 'cargo';

                            if (!Number.isFinite(kmNum) || kmNum <= 0) {
                                throw new BadRequestException('Rayon (km) invalide pour Transfert Inter Dépôt Spot (trp15).');
                            }
                            if (!Number.isFinite(palettesNum) || palettesNum <= 0) {
                                throw new BadRequestException('Nombre de palettes invalide pour Transfert Inter Dépôt Spot (trp15).');
                            }

                            const cfg = diversData?.diversAziza?.transfertInterDepotSpot as any;
                            const remisePercentRaw = Number(cfg?.remise);
                            const remisePercent = Number.isFinite(remisePercentRaw) ? remisePercentRaw : 0.5;

                            const tauxCfg = cfg?.tauxPaletteRayon;
                            let taux: number | null = null;
                            if (typeof tauxCfg === 'number') {
                                taux = tauxCfg;
                            } else {
                                const picked = tauxCfg?.[effectiveVehicle];
                                if (Number.isFinite(Number(picked))) taux = Number(picked);
                            }

                            if (!Number.isFinite(Number(taux)) || Number(taux) <= 0) {
                                throw new BadRequestException('Taux non configuré pour Transfert Inter Dépôt Spot (trp15).');
                            }

                            const brut = kmNum * palettesNum * Number(taux);
                            const remiseAmount = brut * remisePercent;
                            finalTarif = brut - remiseAmount;

                            details = {
                                formula: 'rayon(km) * nbr_palettes * taux(vehicle) - remise',
                                km: kmNum,
                                palettes: palettesNum,
                                nbCargo,
                                effectiveVehicle,
                                taux: Number(taux),
                                brut,
                                remisePercent,
                                remiseAmount,
                                net: finalTarif,
                            };
                        }
                        break;

                    // Transport Surgelé
                    // calcul: besoin * rayon(km) * tarif_frais_aziza + 15% majoration
                    case 'transportSurgele':
                        {
                            const kmNum = Number(km) || 0;
                            if (!Number.isFinite(kmNum) || kmNum <= 0) {
                                throw new BadRequestException('Rayon (km) invalide pour Transport Surgelé.');
                            }
                            if (!Number.isFinite(besoinNum) || besoinNum <= 0) {
                                throw new BadRequestException('Besoin invalide pour Transport Surgelé.');
                            }

                            const tarifFraisAziza = Number((diversData?.diversAziza?.transportSurgele as any)?.tarifFraisAziza);
                            const majorationPercent = Number((diversData?.diversAziza?.transportSurgele as any)?.majorationSurgele);

                            if (!Number.isFinite(tarifFraisAziza) || tarifFraisAziza <= 0) {
                                throw new BadRequestException('Transport Surgelé: tarifFraisAziza non configuré.');
                            }
                            if (!Number.isFinite(majorationPercent) || majorationPercent < 0) {
                                throw new BadRequestException('Transport Surgelé: majorationSurgele invalide.');
                            }

                            const brut = besoinNum * kmNum * tarifFraisAziza;
                            const majoration = brut * majorationPercent;
                            finalTarif = brut + majoration;
                            details = {
                                formula: 'besoin * rayon(km) * tarif_frais_aziza + majoration',
                                besoin: besoinNum,
                                km: kmNum,
                                tarifFraisAziza,
                                majorationPercent,
                                brut,
                                majoration,
                                total: finalTarif,
                            };
                        }
                        break;

                    // trp16 — Transfert Inter Magasin (keep old logic as it uses rayon*palettes)
                    case 'transfertInterMagazin':
                        {
                            const baseTarif = getBaseTarif();
                            const retourPercentRaw = Number(diversData?.diversAziza?.transfertInterMagazin?.tarifs?.baseRetours);
                            const retourPercent = Number.isFinite(retourPercentRaw) ? retourPercentRaw / 100 : 0;
                            const tarifRetour = dto.isReturnTrip ? baseTarif * retourPercent : 0;

                            finalTarif = baseTarif + tarifRetour;
                            details = dto.isReturnTrip
                                ? {
                                    formula: 'tarif_aziza + tarif_retour',
                                    baseTarif,
                                    retourPercent,
                                    tarifRetour,
                                }
                                : {
                                    formula: 'tarif_aziza (facturation normale)',
                                    baseTarif,
                                };
                        }
                        break;

                    // trp12 — Transfert Lilas
                    case 'transfertLilas':
                        {
                            const kmNum = Number(km) || 0;
                            if (!Number.isFinite(kmNum) || kmNum <= 0) {
                                throw new BadRequestException('Rayon (km) invalide pour Transfert Lilas (trp12).');
                            }
                            if (!Number.isFinite(besoinNum) || besoinNum <= 0) {
                                throw new BadRequestException('Nombre de véhicules invalide pour Transfert Lilas (trp12).');
                            }

                            finalTarif = besoinNum * kmNum;
                            details = {
                                formula: 'nb_vehicules * km',
                                nbVehicules: besoinNum,
                                km: kmNum,
                                total: finalTarif,
                            };
                        }
                        break;

                    default:
                        throw new BadRequestException('Sous-catégorie Divers Aziza invalide.');
                }
                break;
            }

            // ══════════════════════════════
            // Industries et CSM (trp23)
            // ══════════════════════════════
            case 'industriesEtCsm':
                {
                    const rawSite = typeof dto.destination === 'string' ? dto.destination : '';
                    const site = rawSite.trim().toLowerCase();

                    const rawVehicle = typeof dto.vehicule === 'string' ? dto.vehicule : '';
                    const vehicle = rawVehicle.trim().toLowerCase();

                    const kmNum = Number(dto.km) || 0;
                    if (!Number.isFinite(kmNum) || kmNum <= 0) {
                        throw new BadRequestException('Industries & CSM (trp23): rayon (km) invalide.');
                    }
                    if (!Number.isFinite(besoinNum) || besoinNum <= 0) {
                        throw new BadRequestException('Industries & CSM (trp23): nombre de véhicules invalide.');
                    }

                    if (!site) {
                        throw new BadRequestException('Industries & CSM (trp23): veuillez sélectionner le site (Zit/Wad Lil/Dandan/Migrin).');
                    }

                    const siteTable = tractageSiteKmRate as any;
                    const pickedSiteRate =
                        site === 'zit' ? siteTable?.zit :
                        (site === 'wad lil' || site === 'wadlil' || site === 'oued lil' || site === 'ouedlil') ? siteTable?.wadLil :
                        site === 'dandan' ? siteTable?.dandan :
                        (site === 'migrin' || site === 'mégrine' || site === 'megrine') ? siteTable?.migrin :
                        undefined;

                    const defaultRate = Number(tractageConfig?.defaultKmRate);
                    const kmRateSite = Number.isFinite(Number(pickedSiteRate)) ? Number(pickedSiteRate) : (Number.isFinite(defaultRate) ? defaultRate : 1);
                    if (!Number.isFinite(kmRateSite) || kmRateSite <= 0) {
                        throw new BadRequestException('Industries & CSM (trp23): kmRate(site) non configuré.');
                    }

                    let vehicleKey: keyof typeof tractageVehicleFactor | null = null;
                    if (vehicle.includes('npr') && vehicle.includes('iveco')) vehicleKey = 'nprIveco';
                    else if (vehicle.includes('pic')) vehicleKey = 'picup';
                    else if (vehicle.includes('nkr')) vehicleKey = 'nkr';
                    else if (vehicle.includes('npr')) vehicleKey = 'npr';
                    else if (vehicle.includes('mercedes')) vehicleKey = 'mercedes';
                    else if (vehicle.includes('semi')) vehicleKey = 'semi';
                    else if (vehicle.includes('iveco')) vehicleKey = 'iveco';

                    const defaultVehicleFactor = Number(tractageConfig?.defaultVehicleFactor);
                    const factor = vehicleKey ? Number((tractageVehicleFactor as any)[vehicleKey]) : (Number.isFinite(defaultVehicleFactor) ? defaultVehicleFactor : 1);
                    if (!Number.isFinite(factor) || factor <= 0) {
                        throw new BadRequestException('Industries & CSM (trp23): factor(vehicule) non configuré.');
                    }

                    finalTarif = kmNum * besoinNum * kmRateSite * factor;
                    details = {
                        formula: 'rayon(km) * nb_vehicules * kmRate(site) * factor(vehicule)',
                        site: rawSite,
                        destination: tractageConfig?.destinationLabel || 'Bouargoub',
                        km: kmNum,
                        nbVehicules: besoinNum,
                        vehicule: rawVehicle,
                        kmRateSite,
                        factorVehicule: factor,
                        total: finalTarif,
                    };
                }
                break;

            // ══════════════════════════════
            // Client Divers
            // ══════════════════════════════
            case 'clientDivers':
                {
                    if (!Number.isFinite(besoinNum) || besoinNum <= 0) {
                        throw new BadRequestException('Client Divers: nombre de véhicules invalide.');
                    }

                    const rawZone = typeof dto.zone === 'string' ? dto.zone : '';
                    const zoneKey = rawZone.trim().toUpperCase() || clientDiversConfig.defaultZone;

                    const rawVehicle = typeof (dto as any).vehicule === 'string' ? String((dto as any).vehicule) : '';
                    const vehicle = rawVehicle.trim().toLowerCase();

                    let vehicleKey: ClientDiversVehicleKey | null = null;
                    if (vehicle.includes('npr') && vehicle.includes('iveco')) vehicleKey = 'nprIveco';
                    else if (vehicle.includes('pic')) vehicleKey = 'picup';
                    else if (vehicle.includes('nkr')) vehicleKey = 'nkr';
                    else if (vehicle.includes('npr')) vehicleKey = 'npr';
                    else if (vehicle.includes('mercedes')) vehicleKey = 'mercedes';
                    else if (vehicle.includes('semi')) vehicleKey = 'semi';
                    else if (vehicle.includes('iveco')) vehicleKey = 'iveco';

                    if (!vehicleKey) {
                        vehicleKey = clientDiversConfig.defaultVehicule;
                    }

                    const tarifZoneVehicule = Number((clientDiversZoneVehiculeTarifs as any)?.[zoneKey]?.[vehicleKey]);
                    const tarifZoneFallback = Number((clientDiversZoneTarifs as any)[zoneKey]);
                    const tarifZone = Number.isFinite(tarifZoneVehicule) && tarifZoneVehicule > 0 ? tarifZoneVehicule : tarifZoneFallback;

                    if (!Number.isFinite(tarifZone) || tarifZone <= 0) {
                        throw new BadRequestException('Client Divers: zone/vehicule invalide ou tarif non configuré.');
                    }

                    const brut = besoinNum * tarifZone;
                    const remisePercent = dto.isSameDepartureAndReturn ? clientDiversConfig.remiseMemeLieuRetour : 0;
                    const remiseAmount = brut * remisePercent;
                    finalTarif = brut - remiseAmount;

                    details = {
                        formula: remisePercent > 0 ? 'besoin * tarif(zone,vehicule) - remise_retour' : 'besoin * tarif(zone,vehicule)',
                        zone: zoneKey,
                        vehicule: vehicleKey,
                        tarifZone,
                        nbVehicules: besoinNum,
                        brut,
                        remisePercent,
                        remiseAmount,
                        total: finalTarif,
                    };
                }
                break;

            // ══════════════════════════════
            // Vielavie Glace (trp4)
            // ══════════════════════════════
            case 'vielavieGlace':
                if (dto.surgelaOption === 'mghiraa') {
                    const rawVehicle = typeof (dto as any).vehicule === 'string' ? String((dto as any).vehicule) : '';
                    const vehicle = rawVehicle.trim().toLowerCase();
                    if (!vehicle || !vehicle.includes('cargo')) {
                        throw new BadRequestException('Vielavie Glace (trp4): véhicule doit être cargo (option Mghiraa).');
                    }

                    const r = Number((freezerData as any)?.mghiraa?.R);
                    if (!Number.isFinite(r) || r <= 0) {
                        throw new BadRequestException('Vielavie Glace (trp4): R non configuré.');
                    }

                    if (!Number.isFinite(besoinNum) || besoinNum <= 0) {
                        throw new BadRequestException('Vielavie Glace (trp4): besoin (nombre cargo) invalide.');
                    }

                    finalTarif = besoinNum * r;
                    details = {
                        formula: 'besoin(cargo) * R (via Mghiraa)',
                        vehicule: 'cargo',
                        nbCargo: besoinNum,
                        R: r,
                        total: finalTarif,
                    };
                } else {
                    const rawVehicle = typeof (dto as any).vehicule === 'string' ? String((dto as any).vehicule) : '';
                    const vehicle = rawVehicle.trim().toLowerCase();

                    let freezerVehicleKey: FreezerVehicleKey | null = null;
                    if (vehicle.includes('nkr')) freezerVehicleKey = 'nkr';
                    else if (vehicle.includes('npr')) freezerVehicleKey = 'npr';
                    else if (vehicle.includes('cargo')) freezerVehicleKey = 'cargo';

                    if (!freezerVehicleKey) {
                        throw new BadRequestException('Vielavie Glace (trp4): véhicule invalide (autres clients: Cargo/NKR/NPR فقط).');
                    }

                    const kmNum = Number(dto.km) || 0;
                    if (!Number.isFinite(kmNum) || kmNum <= 0) {
                        throw new BadRequestException('Vielavie Glace (trp4): rayon(km) invalide (autres clients).');
                    }

                    const maxKm = Number((freezerData as any)?.autresClients?.maxKm) || 500;
                    if (kmNum > maxKm) {
                        throw new BadRequestException(`Vielavie Glace (trp4): rayon(km) > ${maxKm} غير مدعوم.`);
                    }

                    const bucket = Math.ceil(kmNum / 25) * 25;
                    const tarifFreezer = Number((freezerData as any)?.autresClients?.tarifsFreezerByKm?.[freezerVehicleKey]?.[bucket]);
                    const fraisStationnement = Number((freezerData as any)?.autresClients?.fraisStationnement);

                    if (!Number.isFinite(tarifFreezer) || tarifFreezer <= 0) {
                        throw new BadRequestException('Vielavie Glace (trp4): tarif freezer(km) non configuré.');
                    }
                    if (!Number.isFinite(fraisStationnement) || fraisStationnement < 0) {
                        throw new BadRequestException('Vielavie Glace (trp4): frais stationnement non configuré.');
                    }

                    finalTarif = tarifFreezer + fraisStationnement;
                    details = {
                        formula: 'Tarif Freezer (par km,vehicule) + Frais Stationnement',
                        vehicule: freezerVehicleKey,
                        km: kmNum,
                        kmBucket: bucket,
                        tarifFreezer,
                        fraisStationnement,
                        total: finalTarif,
                    };
                }
                break;

            // ══════════════════════════════
            // Surgelé (trp8)
            // ══════════════════════════════
            case 'surgele': {
                const zoneTarifStr = typeof dto.zone === 'string' ? dto.zone : 'Zone A';

                const kmNum = Number(km) || 0;
                if (!Number.isFinite(kmNum) || kmNum <= 0) {
                    throw new BadRequestException('Surgelé (trp8): rayon(km) invalide.');
                }

                const factor = Number((diversData?.surgele as any)?.zoneFactor?.[zoneTarifStr]);
                const baseFraisRate = Number((diversData?.diversAziza as any)?.transportSurgele?.tarifFraisAziza);

                if (Number.isFinite(factor) && factor > 0 && Number.isFinite(baseFraisRate) && baseFraisRate > 0) {
                    finalTarif = kmNum * baseFraisRate * factor;
                    details = {
                        formula: 'rayon(km) * tarifFraisAziza(DT/km) * zoneFactor',
                        zone: zoneTarifStr,
                        km: kmNum,
                        tarifFraisAziza: baseFraisRate,
                        zoneFactor: factor,
                        total: finalTarif,
                    };
                } else {
                    const legacyRate = Number((diversData?.surgele as any)?.zones?.[zoneTarifStr]) || 10;
                    finalTarif = kmNum * legacyRate;
                    details = {
                        formula: 'rayon(km) * zone_rate (legacy)',
                        zone: zoneTarifStr,
                        km: kmNum,
                        zoneRate: legacyRate,
                        total: finalTarif,
                    };
                }
                break;
            }

            default:
                throw new BadRequestException('Catégorie Divers non reconnue.');
        }

        if (dto.merchandises && dto.merchandises.length > 0) {
            details.merchandises = dto.merchandises;
        }

        return { tarif: finalTarif, details };
    }
}

