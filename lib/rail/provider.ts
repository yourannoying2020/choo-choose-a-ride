import type {RailProvider} from './types';
import {mockProvider} from './mock-provider';

export function getRailProvider():RailProvider{
 switch((process.env.RAIL_PROVIDER||'mock').toLowerCase()){
  case 'mock': return mockProvider;
  // Future: case 'ojp': return nationalRailProvider;
  default: return mockProvider;
 }
}
