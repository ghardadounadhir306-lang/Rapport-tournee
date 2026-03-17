import { Injectable } from '@nestjs/common';

@Injectable()
export class TmsService {
  private data = {
    entriesCount: 0,
    list: [],
    active: null,
  };

  getData() {
    return this.data;
  }
}
