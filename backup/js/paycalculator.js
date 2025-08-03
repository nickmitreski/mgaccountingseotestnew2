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
    const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value) || 38;
    
    // Get options
    const includeSuperannuation = document.getElementById('includeSuperOption').checked;
    const noPrivateHealth = document.getElementById('noPrivateHealthOption').checked;
    const isNonResident = document.getElementById('nonResidentOption').checked;
    const hasHelpDebt = document.getElementById('helpDebtOption').checked;
    
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
    const taxResult = calculateTaxComponents(annualSalary, taxYear, isNonResident, hasHelpDebt, noPrivateHealth);
    
    // Calculate take home pay
    const takeHomePay = annualSalary - taxResult.totalTax;
    
    // Update UI with results
    updateResultsUI(annualSalary, superAmount, taxResult, takeHomePay);
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
 * Calculate all tax components based on annual salary
 */
function calculateTaxComponents(annualSalary, taxYear, isNonResident, hasHelpDebt, noPrivateHealth) {
    // Income tax calculation
    const incomeTax = calculateIncomeTax(annualSalary, taxYear, isNonResident);
    
    // Medicare levy calculation
    const medicareLevy = isNonResident ? 0 : calculateMedicareLevy(annualSalary);
    
    // Medicare levy surcharge calculation
    const medicareLevySurcharge = (noPrivateHealth && !isNonResident) ? 
                                calculateMedicareLevySurcharge(annualSalary) : 0;
    
    // Low income tax offset calculation
    const lito = isNonResident ? 0 : calculateLowIncomeTaxOffset(annualSalary, taxYear);
    
    // HELP/HECS debt repayment calculation
    const helpRepayment = hasHelpDebt ? calculateHelpRepayment(annualSalary) : 0;
    
    // Calculate total tax
    const totalTax = incomeTax + medicareLevy + medicareLevySurcharge - lito + helpRepayment;
    
    // Calculate effective tax rate
    const effectiveTaxRate = (totalTax / annualSalary * 100).toFixed(2) + '%';
    
    return {
        incomeTax,
        medicareLevy,
        medicareLevySurcharge,
        lowIncomeOffset: lito,
        helpRepayment,
        totalTax,
        effectiveTaxRate
    };
}

/**
 * Calculate income tax based on tax brackets
 */
function calculateIncomeTax(income, taxYear, isNonResident) {
    // 2024-25 tax rates
    if (isNonResident) {
        // Non-resident tax rates for 2024-25
        if (income <= 135000) {
            return income * 0.30;
        } else if (income <= 190000) {
            return 40500 + (income - 135000) * 0.37;
        } else {
            return 60850 + (income - 190000) * 0.45;
        }
    } else {
        // Resident tax rates for 2024-25
        if (income <= 18200) {
            return 0;
        } else if (income <= 45000) {
            return (income - 18200) * 0.16;
        } else if (income <= 135000) {
            return 4288 + (income - 45000) * 0.30;
        } else if (income <= 190000) {
            return 31288 + (income - 135000) * 0.37;
        } else {
            return 51538 + (income - 190000) * 0.45;
        }
    }
}

/**
 * Calculate Medicare Levy
 */
function calculateMedicareLevy(income) {
    const basicRate = 0.02; // 2% Medicare levy rate
    
    // Medicare levy reduction threshold (2023-24 values - update when 2024-25 available)
    const singleLowerThreshold = 24276;
    const singleUpperThreshold = 30345;
    
    if (income <= singleLowerThreshold) {
        // Full exemption for low income
        return 0;
    } else if (income <= singleUpperThreshold) {
        // Reduced levy for income between thresholds (10% phase-in rate)
        return (income - singleLowerThreshold) * 0.10 * basicRate;
    } else {
        // Standard 2% Medicare levy
        return income * basicRate;
    }
}

/**
 * Calculate Medicare Levy Surcharge
 */
function calculateMedicareLevySurcharge(income) {
    // MLS thresholds for singles (2024-25)
    if (income <= 93000) {
        return 0; // No surcharge
    } else if (income <= 108000) {
        return income * 0.01; // 1% surcharge
    } else if (income <= 144000) {
        return income * 0.0125; // 1.25% surcharge
    } else {
        return income * 0.015; // 1.5% surcharge
    }
}

/**
 * Calculate Low Income Tax Offset (LITO)
 */
function calculateLowIncomeTaxOffset(income, taxYear) {
    // LITO for 2024-25
    if (income <= 37500) {
        return 700;
    } else if (income <= 45000) {
        return 700 - ((income - 37500) * 0.05);
    } else if (income <= 66667) {
        return 325 - ((income - 45000) * 0.015);
    } else {
        return 0;
    }
}

/**
 * Calculate HELP/HECS Repayments
 */
function calculateHelpRepayment(income) {
    // HELP/HECS repayment thresholds and rates for 2023-24
    // Update these rates when 2024-25 becomes available
    if (income < 51550) {
        return 0;
    } else if (income < 59518) {
        return income * 0.01;
    } else if (income < 67087) {
        return income * 0.02;
    } else if (income < 70889) {
        return income * 0.025;
    } else if (income < 74990) {
        return income * 0.03;
    } else if (income < 79391) {
        return income * 0.035;
    } else if (income < 83955) {
        return income * 0.04;
    } else if (income < 88763) {
        return income * 0.045;
    } else if (income < 93843) {
        return income * 0.05;
    } else if (income < 99214) {
        return income * 0.055;
    } else if (income < 104906) {
        return income * 0.06;
    } else if (income < 110951) {
        return income * 0.065;
    } else if (income < 117377) {
        return income * 0.07;
    } else if (income < 124222) {
        return income * 0.075;
    } else if (income < 131543) {
        return income * 0.08;
    } else if (income < 139381) {
        return income * 0.085;
    } else if (income < 147741) {
        return income * 0.09;
    } else if (income < 156689) {
        return income * 0.095;
    } else {
        return income * 0.10;
    }
}

/**
 * Update the UI with calculation results
 */
function updateResultsUI(annualSalary, superAmount, taxResult, takeHomePay) {
    // Format the summary table values
    updateSummaryTable(annualSalary, superAmount, taxResult.totalTax, takeHomePay);
    
    // Update the detailed breakdown
    document.getElementById('incomeTax').textContent = formatCurrency(taxResult.incomeTax);
    document.getElementById('medicareLevy').textContent = formatCurrency(taxResult.medicareLevy);
    document.getElementById('medicareSurcharge').textContent = formatCurrency(taxResult.medicareLevySurcharge);
    document.getElementById('lowIncomeOffset').textContent = formatCurrency(taxResult.lowIncomeOffset);
    document.getElementById('helpRepayment').textContent = formatCurrency(taxResult.helpRepayment);
    document.getElementById('totalTax').textContent = formatCurrency(taxResult.totalTax);
    document.getElementById('effectiveTaxRate').textContent = taxResult.effectiveTaxRate;
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
