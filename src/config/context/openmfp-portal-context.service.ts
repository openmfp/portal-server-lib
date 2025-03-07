import { Injectable } from '@nestjs/common';
import { PortalContextProvider } from './portal-context-provider';

@Injectable()
export class OpenmfpPortalContextService implements PortalContextProvider {
  private readonly openmfpPortalContext = 'OPENMFP_PORTAL_CONTEXT_';
  
  getContextValues(): Promise<Record<string, any>> {
    const context: Record<string, any> = {};
    
    const keys = Object.keys(process.env).filter(item=> item.startsWith(this.openmfpPortalContext));
    keys.forEach(key=>{
      const keyName = key.substring(this.openmfpPortalContext.length).trim();
      if(keyName.length > 0) {
        const camelCaseName = this.toCamelCase(keyName);
        context[camelCaseName] = process.env[key];
      }
    })
    
    return Promise.resolve(context);
  }
  
  private toCamelCase(text: string): string {
      let firstSegment = true;
      const items = text.split('_').map(item=>{
        if(firstSegment){
          firstSegment = false
          return item.toLowerCase();
        }
        return this.capitalizeFirstLetter(item.toLowerCase());
      });
      return items.join('');
  }

  private capitalizeFirstLetter(text: string): string {
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
  }
}

