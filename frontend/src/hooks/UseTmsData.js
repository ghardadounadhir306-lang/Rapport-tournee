import { useState, useEffect, useMemo } from 'react'
import { apiUrl } from '../utils/apiBase'

const EMPTY_FILTERS = {
  wms: '', tms: '', date: '', site: '',
  truck: '', driver: '', dep: '', prestation: '',
}

export function useTmsData({ userZone } = {}) {
  const [tms, setTms] = useState(null)
  const [tmsFilters, setTmsFilters] = useState(EMPTY_FILTERS)

  const fetchTmsData = () => {
    const queryParams = new URLSearchParams()
    if (tmsFilters.tms)        queryParams.append('tms',        tmsFilters.tms)
    if (tmsFilters.wms)        queryParams.append('wms',        tmsFilters.wms)
    if (tmsFilters.date)       queryParams.append('date',       tmsFilters.date)
    if (tmsFilters.site)       queryParams.append('site',       tmsFilters.site)
    if (tmsFilters.truck)      queryParams.append('truck',      tmsFilters.truck)
    if (tmsFilters.driver)     queryParams.append('driver',     tmsFilters.driver)
    if (tmsFilters.dep)        queryParams.append('dep',        tmsFilters.dep)
    if (tmsFilters.prestation) queryParams.append('prestation', tmsFilters.prestation)

    const qs = queryParams.toString()
    const path = qs ? `/api/tms?${qs}` : '/api/tms'

    // Build headers — send user zone so backend filters data server-side
    const headers = {}
    if (userZone) headers['X-User-Zone'] = String(userZone).trim().toUpperCase()

    fetch(apiUrl(path), { headers })
      .then((res) => res.json())
      .then((json) => setTms(json))
      .catch(() => setTms(null))
  }

  useEffect(() => {
    const timer = setTimeout(fetchTmsData, 300)
    return () => clearTimeout(timer)
  }, [tmsFilters, userZone])

  const list = useMemo(() => tms?.list ?? [], [tms])
  const filteredList = list

  const activeFilterChips = useMemo(() => {
    const chips = []
    if (tmsFilters.wms)        chips.push({ label: 'WMS',        value: tmsFilters.wms })
    if (tmsFilters.tms)        chips.push({ label: 'TMS',        value: tmsFilters.tms })
    if (tmsFilters.date)       chips.push({ label: 'Date',       value: tmsFilters.date })
    if (tmsFilters.site)       chips.push({ label: 'Site',       value: tmsFilters.site })
    if (tmsFilters.truck)      chips.push({ label: 'Camion',     value: tmsFilters.truck })
    if (tmsFilters.driver)     chips.push({ label: 'Chauffeur',  value: tmsFilters.driver })
    if (tmsFilters.dep)        chips.push({ label: 'Dep',        value: tmsFilters.dep })
    if (tmsFilters.prestation) chips.push({ label: 'Prestation', value: tmsFilters.prestation })
    return chips
  }, [tmsFilters])

  const clearFilters = () => setTmsFilters(EMPTY_FILTERS)

  /** @param {string} formDataId e.g. sidebar item id `tms-12345` */
  const fetchTmsDetail = async (formDataId) => {
    try {
      const res = await fetch(apiUrl(`/api/tms/form-data/${encodeURIComponent(formDataId)}`))
      const data = await res.json()
      return data
    } catch (e) {
      console.error('fetchTmsDetail error:', e)
      return null
    }
  }

  return {
    tms,
    list,
    filteredList,
    tmsFilters,
    setTmsFilters,
    activeFilterChips,
    clearFilters,
    fetchTmsDetail,
  }
}
