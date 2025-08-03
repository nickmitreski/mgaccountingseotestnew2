/**
 * Tax calculation utility types and functions
 */

// Types for tax configuration
export interface TaxBracket {
    threshold: number;
    rate: number;
}

export interface MedicareLevyThresholds {
    individual: {
        lower: number;
        upper: number;
    };
    family: {
        lower: number;
        upper: number;
        additionalPerDependent: number;
    };
}

export interface MedicareLevySurchargeThresholds {
    individual: TaxBracket[];
    family: TaxBracket[];
}

export interface PrivateHealthRebate {
    age: {
        under65: number;
        sixtyFiveToSixtyNine: number;
        over70: number;
    };
    incomeTiers: {
        base: number;
        tier1: number;
        tier2: number;
        tier3: number;
    };
}

export interface HelpRepaymentThreshold {
    threshold: number;
    rate: number;
}

// Configuration for 2024-25 tax year
export const TAX_CONFIG = {
    taxBrackets: {
        resident: [
            { threshold: 0, rate: 0 },
            { threshold: 18200, rate: 0.19 },
            { threshold: 45000, rate: 0.30 },
            { threshold: 135000, rate: 0.37 },
            { threshold: 190000, rate: 0.45 }
        ],
        nonResident: [
            { threshold: 0, rate: 0.325 },
            { threshold: 135000, rate: 0.37 },
            { threshold: 190000, rate: 0.45 }
        ]
    },
    medicareLevy: {
        rate: 0.02,
        thresholds: {
            individual: {
                lower: 24276,
                upper: 30345
            },
            family: {
                lower: 41112,
                upper: 51094,
                additionalPerDependent: 3760
            }
        }
    },
    medicareLevySurcharge: {
        individual: [
            { threshold: 0, rate: 0 },
            { threshold: 93000, rate: 0.01 },
            { threshold: 108000, rate: 0.0125 },
            { threshold: 144000, rate: 0.015 }
        ],
        family: [
            { threshold: 0, rate: 0 },
            { threshold: 186000, rate: 0.01 },
            { threshold: 216000, rate: 0.0125 },
            { threshold: 288000, rate: 0.015 }
        ]
    },
    privateHealthRebate: {
        age: {
            under65: 24.608,
            sixtyFiveToSixtyNine: 28.710,
            over70: 32.812
        },
        incomeTiers: {
            base: 1.0,
            tier1: 0.6567,
            tier2: 0.3278,
            tier3: 0
        }
    },
    helpRepayment: [
        { threshold: 0, rate: 0 },
        { threshold: 51550, rate: 0.01 },
        { threshold: 57154, rate: 0.02 },
        { threshold: 62738, rate: 0.025 },
        { threshold: 66502, rate: 0.03 },
        { threshold: 70717, rate: 0.035 },
        { threshold: 75956, rate: 0.04 },
        { threshold: 81808, rate: 0.045 },
        { threshold: 86768, rate: 0.05 },
        { threshold: 91647, rate: 0.055 },
        { threshold: 96709, rate: 0.06 },
        { threshold: 102013, rate: 0.065 },
        { threshold: 107762, rate: 0.07 },
        { threshold: 113720, rate: 0.075 },
        { threshold: 120193, rate: 0.08 },
        { threshold: 126968, rate: 0.085 },
        { threshold: 134096, rate: 0.09 },
        { threshold: 141533, rate: 0.095 },
        { threshold: 149420, rate: 0.10 }
    ]
};

/**
 * Calculate base income tax based on tax brackets
 * @param {number} taxableIncome - Annual taxable income
 * @param {boolean} isResident - Whether the taxpayer is a resident
 * @returns {number} Calculated base tax
 */
export function calculateBaseTax(taxableIncome: number, isResident: boolean): number {
    const brackets = isResident ? TAX_CONFIG.taxBrackets.resident : TAX_CONFIG.taxBrackets.nonResident;
    let tax = 0;
    
    for (let i = brackets.length - 1; i >= 0; i--) {
        if (taxableIncome > brackets[i].threshold) {
            tax += (taxableIncome - brackets[i].threshold) * brackets[i].rate;
            taxableIncome = brackets[i].threshold;
        }
    }
    
    return tax;
}

/**
 * Calculate Medicare Levy including family threshold adjustments
 * @param {number} taxableIncome - Annual taxable income
 * @param {number} dependents - Number of dependents
 * @param {boolean} isFamily - Whether to use family thresholds
 * @returns {number} Calculated Medicare Levy
 */
export function calculateMedicareLevy(
    taxableIncome: number,
    dependents: number = 0,
    isFamily: boolean = false
): number {
    const thresholds = TAX_CONFIG.medicareLevy.thresholds;
    const rate = TAX_CONFIG.medicareLevy.rate;
    
    if (isFamily) {
        const familyLower = thresholds.family.lower + (dependents * thresholds.family.additionalPerDependent);
        const familyUpper = thresholds.family.upper + (dependents * thresholds.family.additionalPerDependent);
        
        if (taxableIncome <= familyLower) return 0;
        if (taxableIncome >= familyUpper) return taxableIncome * rate;
        
        return (taxableIncome - familyLower) * (rate * 0.1);
    }
    
    if (taxableIncome <= thresholds.individual.lower) return 0;
    if (taxableIncome >= thresholds.individual.upper) return taxableIncome * rate;
    
    return (taxableIncome - thresholds.individual.lower) * (rate * 0.1);
}

/**
 * Calculate Medicare Levy Surcharge
 * @param {number} taxableIncome - Annual taxable income
 * @param {boolean} hasPrivateHealth - Whether the person has private health insurance
 * @param {boolean} isFamily - Whether to use family thresholds
 * @returns {number} Calculated Medicare Levy Surcharge
 */
export function calculateMedicareLevySurcharge(
    taxableIncome: number,
    hasPrivateHealth: boolean,
    isFamily: boolean = false
): number {
    if (hasPrivateHealth) return 0;
    
    const thresholds = isFamily ? 
        TAX_CONFIG.medicareLevySurcharge.family :
        TAX_CONFIG.medicareLevySurcharge.individual;
    
    let rate = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (taxableIncome > thresholds[i].threshold) {
            rate = thresholds[i].rate;
            break;
        }
    }
    
    return taxableIncome * rate;
}

/**
 * Calculate private health insurance rebate
 * @param {number} taxableIncome - Annual taxable income
 * @param {number} age - Age of the primary policyholder
 * @param {boolean} isFamily - Whether to use family thresholds
 * @returns {number} Rebate percentage
 */
export function calculatePrivateHealthRebate(
    taxableIncome: number,
    age: number,
    isFamily: boolean = false
): number {
    const rebate = TAX_CONFIG.privateHealthRebate;
    const baseRebate = age >= 70 ? rebate.age.over70 :
                      age >= 65 ? rebate.age.sixtyFiveToSixtyNine :
                      rebate.age.under65;
    
    const thresholds = isFamily ? 
        TAX_CONFIG.medicareLevySurcharge.family :
        TAX_CONFIG.medicareLevySurcharge.individual;
    
    if (taxableIncome <= thresholds[0].threshold) return baseRebate * rebate.incomeTiers.base;
    if (taxableIncome <= thresholds[1].threshold) return baseRebate * rebate.incomeTiers.tier1;
    if (taxableIncome <= thresholds[2].threshold) return baseRebate * rebate.incomeTiers.tier2;
    return baseRebate * rebate.incomeTiers.tier3;
}

/**
 * Calculate HELP/HECS debt repayment
 * @param {number} taxableIncome - Annual taxable income
 * @param {number} helpBalance - Current HELP/HECS debt balance
 * @param {boolean} isOverseas - Whether the person is residing overseas
 * @returns {Object} Repayment details including amount and timeline
 */
export function calculateHelpRepayment(
    taxableIncome: number,
    helpBalance: number,
    isOverseas: boolean = false
): {
    compulsoryAmount: number;
    voluntaryBonus: number;
    projectedYearsToRepay: number;
} {
    if (!helpBalance || helpBalance <= 0) {
        return {
            compulsoryAmount: 0,
            voluntaryBonus: 0,
            projectedYearsToRepay: 0
        };
    }
    
    let rate = 0;
    for (let i = TAX_CONFIG.helpRepayment.length - 1; i >= 0; i--) {
        if (taxableIncome > TAX_CONFIG.helpRepayment[i].threshold) {
            rate = TAX_CONFIG.helpRepayment[i].rate;
            break;
        }
    }
    
    // Overseas residents pay higher rates
    if (isOverseas) {
        rate = rate * 1.25;
    }
    
    const compulsoryAmount = taxableIncome * rate;
    
    // Calculate voluntary bonus (if paid upfront)
    const voluntaryBonus = Math.min(helpBalance * 0.05, 500);
    
    // Project years to repay based on current income and balance
    const yearlyRepayment = compulsoryAmount;
    const projectedYearsToRepay = yearlyRepayment > 0 ? 
        Math.ceil(helpBalance / yearlyRepayment) : 
        Infinity;
    
    return {
        compulsoryAmount,
        voluntaryBonus,
        projectedYearsToRepay
    };
} 