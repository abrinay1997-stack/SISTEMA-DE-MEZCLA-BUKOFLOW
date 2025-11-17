import { RELEASE_STEPS } from '../constants';
import { resourceData } from '../data/resourceData';
import { marketingGuideData } from '../data/eqData';
import { brandingGuideData } from '../data/compressionData';
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
    const steps: Step[] = RELEASE_STEPS.filter(step =>
        searchInString(term, step.title) ||
        searchInString(term, step.subtitle) ||
        searchInString(term, step.philosophy) ||
        searchInString(term, step.method) ||
        searchInString(term, step.note) ||
        step.subSteps.some(sub => searchInString(term, sub.text))
    );

    // Search Guides
    const guides: { guide: 'marketing' | 'branding'; term: string }[] = [];
    if (JSON.stringify(marketingGuideData).toLowerCase().includes(term)) {
        guides.push({ guide: 'marketing', term: 'Plan de Marketing' });
    }
    if (JSON.stringify(brandingGuideData).toLowerCase().includes(term)) {
        guides.push({ guide: 'branding', term: 'Branding de Artista' });
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