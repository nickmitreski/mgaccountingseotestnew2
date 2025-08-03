import {
    calculateBaseTax,
    calculateMedicareLevy,
    calculateMedicareLevySurcharge,
    calculatePrivateHealthRebate,
    calculateHelpRepayment
} from './tax-utils';

interface TaxCalculatorInputs {
    annualIncome: number;
    taxWithheld: number;
    superContributions: number;
    fringeBenefits: number;
    otherIncome: number;
    totalDeductions: number;
    helpBalance: number;
    age: number;
    dependents: number;
    isFamily: boolean;
    isResident: boolean;
    hasPrivateHealth: boolean;
    isOverseas: boolean;
}

interface TaxCalculatorResults {
    grossIncome: number;
    taxableIncome: number;
    baseTax: number;
    medicareLevy: number;
    medicareLevySurcharge: number;
    privateHealthRebate: number;
    helpRepayment: {
        compulsoryAmount: number;
        voluntaryBonus: number;
        projectedYearsToRepay: number;
    };
    totalTaxLiability: number;
    taxRefund: number;
    effectiveTaxRate: string;
}

function formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calculateTax(inputs: TaxCalculatorInputs): TaxCalculatorResults {
    // Calculate gross and taxable income
    const grossIncome = inputs.annualIncome + inputs.otherIncome + inputs.fringeBenefits;
    const taxableIncome = Math.max(0, grossIncome - inputs.totalDeductions);
    
    // Calculate all tax components
    const baseTax = calculateBaseTax(taxableIncome, inputs.isResident);
    const medicareLevy = calculateMedicareLevy(taxableIncome, inputs.dependents, inputs.isFamily);
    const medicareLevySurcharge = calculateMedicareLevySurcharge(
        taxableIncome,
        inputs.hasPrivateHealth,
        inputs.isFamily
    );
    const privateHealthRebate = calculatePrivateHealthRebate(
        taxableIncome,
        inputs.age,
        inputs.isFamily
    );
    const helpRepayment = calculateHelpRepayment(
        taxableIncome,
        inputs.helpBalance,
        inputs.isOverseas
    );
    
    // Calculate total tax liability
    const totalTaxLiability = baseTax + medicareLevy + medicareLevySurcharge - privateHealthRebate + helpRepayment.compulsoryAmount;
    
    // Calculate refund/debt
    const taxRefund = inputs.taxWithheld - totalTaxLiability;
    
    // Calculate effective tax rate
    const effectiveTaxRate = ((totalTaxLiability / taxableIncome) * 100).toFixed(1) + '%';
    
    return {
        grossIncome,
        taxableIncome,
        baseTax,
        medicareLevy,
        medicareLevySurcharge,
        privateHealthRebate,
        helpRepayment,
        totalTaxLiability,
        taxRefund,
        effectiveTaxRate
    };
}

// Initialize mobile calculator
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mobileTaxForm') as HTMLFormElement;
    const resultsContainer = document.getElementById('mobileResultsContainer');
    
    if (!form || !resultsContainer) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const inputs: TaxCalculatorInputs = {
            annualIncome: parseFloat((<HTMLInputElement>document.getElementById('annualIncomeMobile')).value) || 0,
            taxWithheld: parseFloat((<HTMLInputElement>document.getElementById('taxWithheldMobile')).value) || 0,
            superContributions: parseFloat((<HTMLInputElement>document.getElementById('superContributionsMobile')).value) || 0,
            fringeBenefits: parseFloat((<HTMLInputElement>document.getElementById('fringeBenefitsMobile')).value) || 0,
            otherIncome: parseFloat((<HTMLInputElement>document.getElementById('otherIncomeMobile')).value) || 0,
            totalDeductions: parseFloat((<HTMLInputElement>document.getElementById('totalDeductionsMobile')).value) || 0,
            helpBalance: parseFloat((<HTMLInputElement>document.getElementById('helpBalanceMobile')).value) || 0,
            age: parseFloat((<HTMLInputElement>document.getElementById('ageMobile')).value) || 0,
            dependents: parseFloat((<HTMLInputElement>document.getElementById('dependentsMobile')).value) || 0,
            isFamily: (<HTMLInputElement>document.getElementById('isFamilyMobile')).checked,
            isResident: (<HTMLInputElement>document.getElementById('isResidentMobile')).checked,
            hasPrivateHealth: (<HTMLInputElement>document.getElementById('hasPrivateHealthMobile')).checked,
            isOverseas: (<HTMLInputElement>document.getElementById('isOverseasMobile')).checked
        };
        
        const results = calculateTax(inputs);
        
        // Update results UI
        resultsContainer.innerHTML = `
            <div class="results-panel ${results.taxRefund >= 0 ? 'refund' : 'debt'}">
                <h3>Tax Calculation Results</h3>
                <div class="result-row">
                    <span>Gross Income:</span>
                    <span>${formatCurrency(results.grossIncome)}</span>
                </div>
                <div class="result-row">
                    <span>Taxable Income:</span>
                    <span>${formatCurrency(results.taxableIncome)}</span>
                </div>
                <div class="result-row">
                    <span>Base Tax:</span>
                    <span>${formatCurrency(results.baseTax)}</span>
                </div>
                <div class="result-row">
                    <span>Medicare Levy:</span>
                    <span>${formatCurrency(results.medicareLevy)}</span>
                </div>
                <div class="result-row">
                    <span>Medicare Levy Surcharge:</span>
                    <span>${formatCurrency(results.medicareLevySurcharge)}</span>
                </div>
                <div class="result-row">
                    <span>Private Health Rebate:</span>
                    <span>${formatCurrency(results.privateHealthRebate)}</span>
                </div>
                <div class="result-row">
                    <span>HELP/HECS Repayment:</span>
                    <span>${formatCurrency(results.helpRepayment.compulsoryAmount)}</span>
                </div>
                ${inputs.helpBalance > 0 ? `
                    <div class="help-details">
                        <div>Voluntary Payment Bonus: ${formatCurrency(results.helpRepayment.voluntaryBonus)}</div>
                        <div>Years to Repay: ${results.helpRepayment.projectedYearsToRepay}</div>
                    </div>
                ` : ''}
                <div class="result-row total">
                    <span>Total Tax Liability:</span>
                    <span>${formatCurrency(results.totalTaxLiability)}</span>
                </div>
                <div class="result-row ${results.taxRefund >= 0 ? 'refund' : 'debt'}">
                    <span>${results.taxRefund >= 0 ? 'Tax Refund:' : 'Tax Debt:'}</span>
                    <span>${formatCurrency(Math.abs(results.taxRefund))}</span>
                </div>
                <div class="result-row">
                    <span>Effective Tax Rate:</span>
                    <span>${results.effectiveTaxRate}</span>
                </div>
            </div>
        `;
    });
}); 