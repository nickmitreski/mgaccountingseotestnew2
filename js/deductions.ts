/**
 * Deduction calculation utilities
 */

export interface HomeOfficeExpenses {
    electricity: number;
    gas: number;
    water: number;
    internet: number;
    phoneUsage: number;
    officeEquipment: number;
    furniture: number;
    repairs: number;
    cleaning: number;
    rent?: number;
    mortgage?: number;
    insurance?: number;
    councilRates?: number;
}

export interface VehicleExpenses {
    fuel: number;
    registration: number;
    insurance: number;
    repairs: number;
    depreciation: number;
    lease?: number;
    tolls: number;
    parking: number;
}

export interface IndustryDeductions {
    tools: number;
    uniforms: number;
    protective: number;
    training: number;
    licenses: number;
    subscriptions: number;
    union: number;
}

/**
 * Calculate home office deductions using actual expenses method
 * @param {HomeOfficeExpenses} expenses - Actual home office expenses
 * @param {number} workUsePercent - Percentage of home used for work (0-100)
 * @param {number} daysWorked - Number of days worked from home per year
 * @returns {number} Total deductible amount
 */
export function calculateActualHomeOffice(
    expenses: HomeOfficeExpenses,
    workUsePercent: number,
    daysWorked: number
): number {
    const yearlyRatio = daysWorked / 365;
    const useRatio = workUsePercent / 100;
    
    // Calculate running costs (electricity, gas, etc.)
    const runningCosts = (
        expenses.electricity +
        expenses.gas +
        expenses.water +
        expenses.internet * 0.5 + // Only 50% of internet is typically allowed
        expenses.phoneUsage
    ) * yearlyRatio * useRatio;
    
    // Calculate occupancy costs if applicable (rent/mortgage, etc.)
    const occupancyCosts = (
        (expenses.rent || 0) +
        (expenses.mortgage || 0) +
        (expenses.insurance || 0) +
        (expenses.councilRates || 0)
    ) * yearlyRatio * useRatio;
    
    // Calculate depreciation on office equipment and furniture
    const depreciation = (
        expenses.officeEquipment * 0.4 + // 40% depreciation rate for computers/equipment
        expenses.furniture * 0.2 // 20% depreciation rate for furniture
    );
    
    // Calculate maintenance costs
    const maintenance = (
        expenses.repairs +
        expenses.cleaning
    ) * yearlyRatio * useRatio;
    
    return runningCosts + occupancyCosts + depreciation + maintenance;
}

/**
 * Calculate vehicle expense deductions using actual costs method
 * @param {VehicleExpenses} expenses - Actual vehicle expenses
 * @param {number} workUsePercent - Percentage of vehicle use for work (0-100)
 * @returns {number} Total deductible amount
 */
export function calculateActualVehicle(
    expenses: VehicleExpenses,
    workUsePercent: number
): number {
    const useRatio = workUsePercent / 100;
    
    // Calculate running costs
    const runningCosts = (
        expenses.fuel +
        expenses.registration +
        expenses.insurance +
        expenses.repairs +
        (expenses.lease || 0)
    ) * useRatio;
    
    // Calculate depreciation
    const depreciation = expenses.depreciation * useRatio;
    
    // Calculate work-related tolls and parking
    const directCosts = expenses.tolls + expenses.parking;
    
    return runningCosts + depreciation + directCosts;
}

/**
 * Calculate industry-specific deductions
 * @param {IndustryDeductions} deductions - Industry-specific deduction amounts
 * @returns {number} Total deductible amount
 */
export function calculateIndustryDeductions(deductions: IndustryDeductions): number {
    return (
        deductions.tools +
        deductions.uniforms +
        deductions.protective +
        deductions.training +
        deductions.licenses +
        deductions.subscriptions +
        deductions.union
    );
}

/**
 * Calculate total deductions
 * @param {HomeOfficeExpenses} homeOffice - Home office expenses
 * @param {number} homeOfficePercent - Percentage of home used for work
 * @param {number} daysWorked - Days worked from home
 * @param {VehicleExpenses} vehicle - Vehicle expenses
 * @param {number} vehiclePercent - Percentage of vehicle use for work
 * @param {IndustryDeductions} industry - Industry-specific deductions
 * @returns {number} Total deductible amount
 */
export function calculateTotalDeductions(
    homeOffice: HomeOfficeExpenses,
    homeOfficePercent: number,
    daysWorked: number,
    vehicle: VehicleExpenses,
    vehiclePercent: number,
    industry: IndustryDeductions
): number {
    const homeOfficeDeduction = calculateActualHomeOffice(homeOffice, homeOfficePercent, daysWorked);
    const vehicleDeduction = calculateActualVehicle(vehicle, vehiclePercent);
    const industryDeduction = calculateIndustryDeductions(industry);
    
    return homeOfficeDeduction + vehicleDeduction + industryDeduction;
} 