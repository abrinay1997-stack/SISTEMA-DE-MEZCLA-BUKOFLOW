import { MIXING_STEPS } from '../constants';
import { resourceData } from '../data/resourceData';
import { eqData } from '../data/eqData';
import { compressionData } from '../data/compressionData';
import { reverbData } from '../data/reverbData';
import { saturationData } from '../data/saturationData';
import type { SearchResult, Step, Resource } from '../types';

const searchInString = (term: string, content: string | undefined): boolean => {
    return content ? content.toLowerCase().includes(term) : false;
}

export const performSearch = (searchTerm: string): SearchResult => {
    const term = searchTerm.toLowerCase();
    if (!term) {
        return { steps: [], guides: [], faqs: [] };
    }

    // Search Steps
    const steps: Step[] = MIXING_STEPS.filter(step =>
        searchInString(term, step.title) ||
        searchInString(term, step.subtitle) ||
        searchInString(term, step.philosophy) ||
        searchInString(term, step.method) ||
        searchInString(term, step.note) ||
        step.subSteps.some(sub => searchInString(term, sub.text))
    );

    // Search Guides
    const guides: { guide: 'eq' | 'compression' | 'reverb' | 'saturation'; term: string }[] = [];
    if (JSON.stringify(eqData).toLowerCase().includes(term)) {
        guides.push({ guide: 'eq', term: 'Ecualización' });
    }
    if (JSON.stringify(compressionData).toLowerCase().includes(term)) {
        guides.push({ guide: 'compression', term: 'Compresión' });
    }
    if (JSON.stringify(reverbData).toLowerCase().includes(term)) {
        guides.push({ guide: 'reverb', term: 'Reverb' });
    }
    if (JSON.stringify(saturationData).toLowerCase().includes(term)) {
        guides.push({ guide: 'saturation', term: 'Saturación' });
    }

    // Search FAQs
    const faqs: Resource[] = resourceData.filter(resource =>
        resource.type === 'faq' && (
            searchInString(term, resource.title) ||
            searchInString(term, resource.description) ||
            resource.tags.some(tag => searchInString(term, tag))
        )
    );

    return { steps, guides, faqs };
};
