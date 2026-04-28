import { Controller, Get } from '@nestjs/common';
import { BaseChauffeurService } from './base-chauffeur.service';

@Controller('api/base-chauffeur')
export class BaseChauffeurController {
	constructor(private readonly baseChauffeurService: BaseChauffeurService) {}

	@Get()
	list() {
		return this.baseChauffeurService.findAll();
	}
}
