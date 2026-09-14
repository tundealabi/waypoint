import type { PackingTemplateId } from './types';

export const packingTemplates: Record<PackingTemplateId, { name: string; quantity?: string }[]> = {
  beach: [
    { name: 'Swimsuit' },
    { name: 'Sunscreen', quantity: '1 bottle' },
    { name: 'Towel' },
    { name: 'Flip flops' },
    { name: 'Sunglasses' },
    { name: 'Sun hat' },
    { name: 'After-sun lotion' },
    { name: 'Charger' },
  ],
  city: [
    { name: 'Comfortable walking shoes' },
    { name: 'Day bag' },
    { name: 'Power adapter' },
    { name: 'Umbrella' },
    { name: 'Light layers' },
    { name: 'Reusable water bottle' },
    { name: 'Portable battery' },
  ],
  camping: [
    { name: 'Tent' },
    { name: 'Sleeping bag' },
    { name: 'Headlamp' },
    { name: 'Water bottle' },
    { name: 'First aid kit' },
    { name: 'Insect repellent' },
    { name: 'Rain jacket' },
  ],
};
