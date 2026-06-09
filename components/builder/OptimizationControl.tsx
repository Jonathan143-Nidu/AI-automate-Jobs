import { AnalysisResult, Step as StepType } from '../../lib/types/resume.types';
import { IntegrateAction } from './sub/IntegrateAction';

interface OptimizationControlProps {
    step: string;
    analysisResult: AnalysisResult | null;
    initialScore: number | null;
    optimizedScore: number | null;
    isIntegrating: boolean;
    gapReasons: string[];
    showGaps: boolean;
    setShowGaps: (show: boolean) => void;
    startIntegration: () => void;
    setStep: (step: StepType) => void;
}

export const OptimizationControl: React.FC<OptimizationControlProps> = ({
    step,
    analysisResult,
    initialScore,
    optimizedScore,
    isIntegrating,
    gapReasons,
    showGaps,
    setShowGaps,
    startIntegration,
    setStep
}) => {
    return (
        <div className="flex flex-col gap-3">
            {step === 'analysis' && (
                <IntegrateAction
                    analysisResult={analysisResult}
                    isIntegrating={isIntegrating}
                    startIntegration={startIntegration}
                />
            )}

            {step === 'integration_summary' && (
                <button
                    onClick={() => setStep('review')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl py-3.5 font-bold tracking-wide shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2"
                >
                    Review Optimizations
                </button>
            )}
        </div>
    );
};
