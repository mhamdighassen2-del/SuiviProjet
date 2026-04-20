// ============================================================
//  ProjectStepper — workflow horizontal par service (EMP)
// ============================================================
import { useMemo } from 'react';
import type { NomService } from '../types/models';
import './ProjectStepper.css';

export type ProjectStepperStep = {
    id: NomService;
    label: string;
    /** Avancement du suivi (0–100), ou null si pas de suivi */
    percent: number | null;
    disabled?: boolean;
};

export type ProjectStepperProps = {
    steps: ProjectStepperStep[];
    activeId: NomService | null;
    onStepClick: (id: NomService) => void;
};

function StepIcon({ id }: { id: NomService }) {
    const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (id) {
        case 'ETUDE':
            return (
                <svg {...common} aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <line x1="8" y1="7" x2="16" y2="7" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            );
        case 'METHODES':
            return (
                <svg {...common} aria-hidden>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
            );
        case 'PRODUCTION':
            return (
                <svg {...common} aria-hidden>
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    <line x1="6" y1="13" x2="6" y2="13.01" />
                    <line x1="10" y1="13" x2="10" y2="13.01" />
                    <line x1="14" y1="13" x2="14" y2="13.01" />
                </svg>
            );
        case 'QUALITE_PRODUIT':
            return (
                <svg {...common} aria-hidden>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.17" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            );
        default:
            return null;
    }
}

export function ProjectStepper({ steps, activeId, onStepClick }: ProjectStepperProps) {
    const activeIndex = useMemo(() => {
        if (!activeId) return -1;
        return steps.findIndex((s) => s.id === activeId);
    }, [steps, activeId]);

    const lineFillPercent = useMemo(() => {
        if (steps.length <= 1 || activeIndex < 0) return 0;
        return (activeIndex / (steps.length - 1)) * 100;
    }, [steps.length, activeIndex]);

    return (
        <div className="project-stepper" role="navigation" aria-label="Étapes du suivi par service">
            <div className="project-stepper__line-wrap" aria-hidden>
                <div className="project-stepper__line-bg" />
                <div
                    className="project-stepper__line-fill"
                    style={{ width: `${lineFillPercent}%` }}
                />
            </div>

            <div className="project-stepper__steps">
                {steps.map((step, index) => {
                    const isActive = activeId === step.id;
                    const isCompleted = activeIndex >= 0 && index < activeIndex;

                    let stateClass = 'project-stepper__step--pending';
                    if (isCompleted) stateClass = 'project-stepper__step--completed';
                    if (isActive) stateClass = 'project-stepper__step--active';

                    return (
                        <button
                            key={step.id}
                            type="button"
                            className={`project-stepper__step ${stateClass}`}
                            disabled={step.disabled}
                            onClick={() => !step.disabled && onStepClick(step.id)}
                            aria-current={isActive ? 'step' : undefined}
                            aria-label={`${step.label}${step.percent != null ? `, ${step.percent}%` : ''}`}
                        >
                            <span className="project-stepper__circle">
                                {isCompleted ? (
                                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <StepIcon id={step.id} />
                                )}
                            </span>
                            <span className="project-stepper__label">{step.label}</span>
                            <span className="project-stepper__pct">
                                {step.percent != null ? `${step.percent}%` : '—'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
