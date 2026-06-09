/**
 * Custom hook for managing skill integration state and operations
 */

import { useState } from 'react';
import { IntegrationResult, ChangeRequest } from '@/lib/types/resume.types';

export const useSkillIntegration = () => {
    const [isIntegrating, setIsIntegrating] = useState(false);
    const [integrationResult, setIntegrationResult] = useState<IntegrationResult | null>(null);
    const [changes, setChanges] = useState<ChangeRequest[]>([]);

    const startIntegration = async (
        resumeText: string,
        missingSkills: string[],
        jd: string
    ) => {
        setIsIntegrating(true);

        try {
            const response = await fetch('/api/integrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, missingSkills, jd }),
            });

            if (!response.ok) {
                throw new Error(`Integration failed: ${response.statusText}`);
            }

            const result = await response.json() as IntegrationResult;
            setIntegrationResult(result);

            // Initialize changes with selected: true
            const initializedChanges = (result.changes || []).map(change => ({
                ...change,
                selected: true
            }));
            setChanges(initializedChanges);

            return result;
        } catch (error) {
            throw error;
        } finally {
            setIsIntegrating(false);
        }
    };

    const toggleChange = (index: number) => {
        setChanges(prev =>
            prev.map((change, i) =>
                i === index ? { ...change, selected: !change.selected } : change
            )
        );
    };

    const toggleAllChanges = (selected: boolean) => {
        setChanges(prev => prev.map(change => ({ ...change, selected })));
    };

    const getSelectedChanges = () => {
        return changes.filter(change => change.selected);
    };

    const reset = () => {
        setIsIntegrating(false);
        setIntegrationResult(null);
        setChanges([]);
    };

    return {
        isIntegrating,
        integrationResult,
        changes,
        startIntegration,
        toggleChange,
        toggleAllChanges,
        getSelectedChanges,
        reset
    };
};
