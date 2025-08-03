/**
 * Australian Tax Calculator
 * 
 * This calculator uses the latest tax rates and thresholds to calculate:
 * - Income tax
 * - Medicare levy
 * - Medicare levy surcharge (if applicable)
 * - HELP/HECS repayments
 * - Take home pay
 */

import {
    calculateBaseTax,
    calculateMedicareLevy,
    calculateMedicareLevySurcharge,
    calculatePrivateHealthRebate,
    calculateHelpRepayment
} from './tax-utils';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI interactions
    initializeUI();
    
    // Add event listener to calculate button
    document.getElementById('calculateButton').addEventListener('click', calculateTax);
    
    // Also trigger calculation when Enter key is pressed
    document.getElementById('salary').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateTax();
        }
    });
});

/**
 * Initialize UI interactions and form behaviors
 */
function initializeUI() {
    // Show/hide hours per week field based on pay period selection
    const payPeriodSelect = document.getElementById('payPeriod');
    const hoursContainer = document.getElementById('hoursContainer');
    
    payPeriodSelect.addEventListener('change', function() {
        if (this.value === 'hourly') {
            hoursContainer.style.display = 'block';
        } else {
            hoursContainer.style.display = 'none';
        }
    });
}

/**
 * Main function to calculate tax and update the UI
 */
function calculateTax() {
    // Get input values
    const payPeriod = document.getElementById('payPeriod').value;
    const inputSalary = parseFloat(document.getElementById('salary').value) || 0;
    const superRate = parseFloat(document.getElementById('superRate').value) || 11.0;
    const taxYear = document.getElementById('taxYear').value;
    const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value) || 0;
    const age = parseFloat(document.getElementById('age').value) || 0;
    const dependents = parseFloat(document.getElementById('dependents').value) || 0;
    
    // Get options
    const includeSuperannuation = document.getElementById('includeSuperOption').checked;
    const hasPrivateHealth = !document.getElementById('noPrivateHealthOption').checked;
    const isResident = !document.getElementById('nonResidentOption').checked;
    const isFamily = document.getElementById('familyOption').checked;
    const isOverseas = document.getElementById('overseasOption').checked;
    const helpBalance = parseFloat(document.getElementById('helpBalance').value) || 0;
    
    // Convert input salary to annual figure
    let annualSalary = convertToAnnual(inputSalary, payPeriod, hoursPerWeek);
    
    // Adjust for superannuation if salary includes it
    let superAmount = 0;
    if (includeSuperannuation) {
        // If salary includes super, remove super component
        superAmount = annualSalary * (superRate / (100 + superRate));
        annualSalary = annualSalary - superAmount;
    } else {
        // If salary excludes super, calculate super separately
        superAmount = annualSalary * (superRate / 100);
    }
    
    // Calculate tax components
    const baseTax = calculateBaseTax(annualSalary, isResident);
    const medicareLevy = calculateMedicareLevy(annualSalary, dependents, isFamily);
    const medicareLevySurcharge = calculateMedicareLevySurcharge(annualSalary, hasPrivateHealth, isFamily);
    const privateHealthRebate = calculatePrivateHealthRebate(annualSalary, age, isFamily);
    const helpRepayment = calculateHelpRepayment(annualSalary, helpBalance, isOverseas);
    
    // Calculate total tax
    const totalTax = baseTax + medicareLevy + medicareLevySurcharge - privateHealthRebate + helpRepayment.compulsoryAmount;
    
    // Calculate take home pay
    const takeHomePay = annualSalary - totalTax;
    
    // Calculate effective tax rate
    const effectiveTaxRate = (totalTax / annualSalary * 100).toFixed(2) + '%';
    
    // Update UI with results
    updateResultsUI({
        annualSalary,
        superAmount,
        baseTax,
        medicareLevy,
        medicareLevySurcharge,
        privateHealthRebate,
        helpRepayment,
        totalTax,
        takeHomePay,
        effectiveTaxRate
    });
}

/**
 * Convert salary to annual amount based on pay period
 */
function convertToAnnual(amount, period, hours) {
    switch (period) {
        case 'hourly':
            return amount * hours * 52;
        case 'weekly':
            return amount * 52;
        case 'fortnightly':
            return amount * 26;
        case 'monthly':
            return amount * 12;
        case 'annual':
        default:
            return amount;
    }
}

/**
 * Update the UI with calculation results
 */
function updateResultsUI(results) {
    // Format the summary table values
    updateSummaryTable(results.annualSalary, results.superAmount, results.totalTax, results.takeHomePay);
    
    // Update the detailed breakdown
    document.getElementById('incomeTax').textContent = formatCurrency(results.baseTax);
    document.getElementById('medicareLevy').textContent = formatCurrency(results.medicareLevy);
    document.getElementById('medicareSurcharge').textContent = formatCurrency(results.medicareLevySurcharge);
    document.getElementById('privateHealthRebate').textContent = formatCurrency(results.privateHealthRebate);
    document.getElementById('helpRepayment').textContent = formatCurrency(results.helpRepayment.compulsoryAmount);
    document.getElementById('totalTax').textContent = formatCurrency(results.totalTax);
    document.getElementById('effectiveTaxRate').textContent = results.effectiveTaxRate;
}

/**
 * Update the summary table with calculated values
 */
function updateSummaryTable(annualSalary, superAmount, totalTax, takeHomePay) {
    // Calculate values for different pay periods
    const weekly = {
        gross: annualSalary / 52,
        super: superAmount / 52,
        tax: totalTax / 52,
        takeHome: takeHomePay / 52
    };
    
    const fortnightly = {
        gross: annualSalary / 26,
        super: superAmount / 26,
        tax: totalTax / 26,
        takeHome: takeHomePay / 26
    };
    
    const monthly = {
        gross: annualSalary / 12,
        super: superAmount / 12,
        tax: totalTax / 12,
        takeHome: takeHomePay / 12
    };
    
    // Update gross income row
    document.getElementById('grossWeekly').textContent = formatCurrency(weekly.gross);
    document.getElementById('grossFortnightly').textContent = formatCurrency(fortnightly.gross);
    document.getElementById('grossMonthly').textContent = formatCurrency(monthly.gross);
    document.getElementById('grossAnnually').textContent = formatCurrency(annualSalary);
    
    // Update super row
    document.getElementById('superWeekly').textContent = formatCurrency(weekly.super);
    document.getElementById('superFortnightly').textContent = formatCurrency(fortnightly.super);
    document.getElementById('superMonthly').textContent = formatCurrency(monthly.super);
    document.getElementById('superAnnually').textContent = formatCurrency(superAmount);
    
    // Update tax row
    document.getElementById('taxWeekly').textContent = formatCurrency(weekly.tax);
    document.getElementById('taxFortnightly').textContent = formatCurrency(fortnightly.tax);
    document.getElementById('taxMonthly').textContent = formatCurrency(monthly.tax);
    document.getElementById('taxAnnually').textContent = formatCurrency(totalTax);
    
    // Update take home pay row
    document.getElementById('takeHomeWeekly').textContent = formatCurrency(weekly.takeHome);
    document.getElementById('takeHomeFortnightly').textContent = formatCurrency(fortnightly.takeHome);
    document.getElementById('takeHomeMonthly').textContent = formatCurrency(monthly.takeHome);
    document.getElementById('takeHomeAnnually').textContent = formatCurrency(takeHomePay);
}

/**
 * Format number as currency
 */
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
