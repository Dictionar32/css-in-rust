/**
 * Component Analysis & Impact Tracking Type Definitions
 * 
 * Comprehensive type definitions for component usage analytics, dependency tracking,
 * bundle impact calculation, and optimization insights.
 * 
 * Requirement 8: Component Usage Analysis
 * 8 Rust functions exposed via NativeBridge
 */

// =============================================================================
// COMPONENT USAGE TRACKING
// =============================================================================

export interface ComponentOccurrence {
  readonly file_path: string
  readonly line_number: number
  readonly column_number: number
  readonly context?: string  // Code snippet context
}

export interface ComponentUsage {
  readonly component_name: string
  readonly occurrence_count: number
  readonly file_locations: ComponentOccurrence[]
  readonly first_used: number
  readonly last_used: number
  readonly is_exported: boolean
  readonly is_imported: boolean
}

export interface ComponentUsageStats {
  readonly total_components: number
  readonly used_components: number
  readonly unused_components: number
  readonly usage_rate_percent: number
  readonly average_usage_per_component: number
  readonly most_used_component: {
    readonly name: string
    readonly usage_count: number
  }
  readonly analysis_time_ms: number
}

export interface ExtendedComponentUsage extends ComponentUsage {
  readonly bundle_impact_bytes: number
  readonly css_impact_bytes: number
  readonly dependencies: string[]
  readonly dependents: string[]
  readonly criticality: 'low' | 'medium' | 'high' | 'critical'
}

// =============================================================================
// BUNDLE IMPACT CALCULATION
// =============================================================================

export interface BundleImpact {
  readonly component_name: string
  readonly js_bytes: number
  readonly css_bytes: number
  readonly total_bytes: number
  readonly percentage_of_bundle: number
  readonly impact_level: 'low' | 'medium' | 'high'
}

export interface BundleImpactAnalysis {
  readonly total_bundle_size_bytes: number
  readonly components_analyzed: number
  readonly components_with_high_impact: BundleImpact[]
  readonly optimization_opportunities: string[]
  readonly potential_savings_bytes: number
  readonly analysis_time_ms: number
}

export interface BundleMetrics {
  readonly total_size_bytes: number
  readonly js_size_bytes: number
  readonly css_size_bytes: number
  readonly assets_size_bytes: number
  readonly gzip_size_bytes?: number
  readonly brotli_size_bytes?: number
  readonly component_count: number
}

// =============================================================================
// DEPENDENCY TRACKING
// =============================================================================

export interface ComponentDependency {
  readonly source: string          // Component that depends on
  readonly target: string          // Component being depended upon
  readonly type: 'import' | 'prop' | 'ref' | 'hook'
  readonly usage_count: number
}

export interface DependencyGraph {
  readonly nodes: Map<string, {
    readonly dependencies: string[]
    readonly dependents: string[]
    readonly depth: number
  }>
  readonly edges: ComponentDependency[]
  readonly acyclic: boolean
  readonly cycles?: Array<string[]>
}

export interface DependencyMetrics {
  readonly total_nodes: number
  readonly total_edges: number
  readonly average_dependencies_per_component: number
  readonly max_dependency_depth: number
  readonly components_with_cycles: string[]
  readonly most_depended_upon: {
    readonly component: string
    readonly dependent_count: number
  }
}

// =============================================================================
// UNUSED COMPONENT DETECTION
// =============================================================================

export interface UnusedComponent {
  readonly component_name: string
  readonly file_path: string
  readonly defined_at: number
  readonly size_bytes: number
  readonly css_usage_bytes: number
  readonly confidence_percent: number
  readonly potential_removal_reason: string
}

export interface UnusedComponentAnalysis {
  readonly unused_components: UnusedComponent[]
  readonly total_unused: number
  readonly unused_percentage: number
  readonly total_unused_bytes: number
  readonly confidence_weighted_bytes: number
  readonly analysis_time_ms: number
}

// =============================================================================
// RISK ASSESSMENT
// =============================================================================

export interface RiskFactors {
  readonly high_dependency_count: boolean
  readonly many_dependents: boolean
  readonly frequently_modified: boolean
  readonly shared_with_external: boolean
  readonly complex_logic: boolean
}

export interface RiskAssessment {
  readonly component_name: string
  readonly risk_level: 'low' | 'medium' | 'high' | 'critical'
  readonly risk_score: number  // 0-100
  readonly factors: RiskFactors
  readonly mitigation_suggestions: string[]
}

// =============================================================================
// IMPACT CALCULATION
// =============================================================================

export interface ImpactMetrics {
  readonly component_name: string
  readonly total_impact_bytes: number
  readonly code_impact_bytes: number
  readonly css_impact_bytes: number
  readonly transitive_impact_bytes: number
  readonly affected_components: string[]
  readonly impact_percentage: number
}

export interface ChangeImpact {
  readonly changed_component: string
  readonly directly_affected: string[]
  readonly indirectly_affected: string[]
  readonly total_affected: number
  readonly estimated_bundle_change_bytes: number
  readonly cascading_changes: boolean
}

// =============================================================================
// OPTIMIZATION OPPORTUNITIES
// =============================================================================

export interface OptimizationOpportunity {
  readonly type: 'split_bundle' | 'lazy_load' | 'remove_unused' | 'deduplicate' | 'refactor'
  readonly component: string
  readonly estimated_savings_bytes: number
  readonly effort_level: 'easy' | 'medium' | 'hard'
  readonly priority: 'low' | 'medium' | 'high'
  readonly implementation_suggestion: string
}

export interface OptimizationReport {
  readonly total_opportunities: number
  readonly opportunities: OptimizationOpportunity[]
  readonly total_potential_savings: number
  readonly savings_percentage: number
  readonly quick_wins: OptimizationOpportunity[]
  readonly recommended_priority_order: OptimizationOpportunity[]
}

// =============================================================================
// SAVINGS CALCULATION
// =============================================================================

export interface SavingsCalculation {
  readonly bundle_size_bytes: number
  readonly component_count: number
  readonly removal_scenario: {
    readonly components_to_remove: string[]
    readonly potential_savings_bytes: number
    readonly reduction_percentage: number
  }
  readonly optimization_scenario: {
    readonly techniques: string[]
    readonly potential_savings_bytes: number
    readonly reduction_percentage: number
  }
}

export interface SavingsAnalysis {
  readonly current_size_bytes: number
  readonly optimized_size_bytes: number
  readonly savings_bytes: number
  readonly savings_percentage: number
  readonly timeline_to_achieve: string
  readonly implementation_complexity: 'low' | 'medium' | 'high'
}

// =============================================================================
// COMPONENT LIFECYCLE & METRICS
// =============================================================================

export interface ComponentMetrics {
  readonly component_name: string
  readonly created_date: number
  readonly last_modified: number
  readonly modification_count: number
  readonly test_coverage_percent: number
  readonly documentation_percent: number
  readonly code_complexity: 'low' | 'medium' | 'high'
}

export interface ComponentHealth {
  readonly component_name: string
  readonly health_score: number  // 0-100
  readonly well_tested: boolean
  readonly well_documented: boolean
  readonly actively_maintained: boolean
  readonly low_complexity: boolean
  readonly recommendations: string[]
}

// =============================================================================
// ANALYSIS MANAGER INTERFACE
// =============================================================================

export interface ComponentAnalysisManager {
  // Component Usage Analysis
  analyzeClassUsage(
    classes: string[],
    scanResult: unknown  // ScanWorkspaceResult
  ): Promise<ComponentUsageStats>
  
  getComponentUsage(componentName: string): Promise<ExtendedComponentUsage>
  
  listUnusedComponents(): Promise<UnusedComponentAnalysis>
  
  // Bundle Impact Analysis
  calculateImpact(
    componentName: string
  ): Promise<ImpactMetrics>
  
  calculateChangeImpact(changedComponent: string): Promise<ChangeImpact>
  
  analyzeBundleImpact(): Promise<BundleImpactAnalysis>
  
  getBundleMetrics(): Promise<BundleMetrics>
  
  // Dependency Analysis
  buildDependencyGraph(): Promise<DependencyGraph>
  
  getDependencyMetrics(): Promise<DependencyMetrics>
  
  findCycles(): Promise<Array<string[]>>
  
  // Risk Assessment
  assessRisk(componentName: string): Promise<RiskAssessment>
  
  assessRiskBatch(components: string[]): Promise<RiskAssessment[]>
  
  // Optimization Opportunities
  findOptimizationOpportunities(): Promise<OptimizationReport>
  
  calculateSavings(strategy: 'remove' | 'lazy_load' | 'split'): Promise<SavingsAnalysis>
  
  // Component Metrics
  getComponentMetrics(componentName: string): Promise<ComponentMetrics>
  
  getComponentHealth(componentName: string): Promise<ComponentHealth>
  
  // Batch Analysis
  analyzeAllComponents(): Promise<ExtendedComponentUsage[]>
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isComponentUsage = (value: unknown): value is ComponentUsage => {
  const v = value as Partial<ComponentUsage>
  return (
    typeof v.component_name === 'string' &&
    typeof v.occurrence_count === 'number' &&
    Array.isArray(v.file_locations)
  )
}

export const isExtendedComponentUsage = (value: unknown): value is ExtendedComponentUsage => {
  const v = value as Partial<ExtendedComponentUsage>
  return (
    isComponentUsage(value) &&
    typeof v.bundle_impact_bytes === 'number' &&
    typeof v.css_impact_bytes === 'number' &&
    Array.isArray(v.dependencies) &&
    Array.isArray(v.dependents)
  )
}

export const isBundleImpact = (value: unknown): value is BundleImpact => {
  const v = value as Partial<BundleImpact>
  return (
    typeof v.component_name === 'string' &&
    typeof v.js_bytes === 'number' &&
    typeof v.css_bytes === 'number' &&
    typeof v.total_bytes === 'number'
  )
}

export const isDependencyGraph = (value: unknown): value is DependencyGraph => {
  const v = value as Partial<DependencyGraph>
  return (
    v.nodes instanceof Map &&
    Array.isArray(v.edges) &&
    typeof v.acyclic === 'boolean'
  )
}

export const isUnusedComponent = (value: unknown): value is UnusedComponent => {
  const v = value as Partial<UnusedComponent>
  return (
    typeof v.component_name === 'string' &&
    typeof v.file_path === 'string' &&
    typeof v.size_bytes === 'number' &&
    typeof v.confidence_percent === 'number'
  )
}

export const isRiskAssessment = (value: unknown): value is RiskAssessment => {
  const v = value as Partial<RiskAssessment>
  return (
    typeof v.component_name === 'string' &&
    ['low', 'medium', 'high', 'critical'].includes(v.risk_level as string) &&
    typeof v.risk_score === 'number'
  )
}

export const isOptimizationOpportunity = (value: unknown): value is OptimizationOpportunity => {
  const v = value as Partial<OptimizationOpportunity>
  return (
    ['split_bundle', 'lazy_load', 'remove_unused', 'deduplicate', 'refactor'].includes(v.type as string) &&
    typeof v.estimated_savings_bytes === 'number' &&
    ['easy', 'medium', 'hard'].includes(v.effort_level as string)
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculates risk score based on dependency metrics
 */
export const calculateRiskScore = (
  dependentCount: number,
  dependencyCount: number,
  isExported: boolean
): number => {
  let score = 0
  
  // Dependents increase risk
  score += Math.min(dependentCount * 10, 40)
  
  // Complex dependencies increase risk
  score += Math.min(dependencyCount * 5, 30)
  
  // Exported components increase risk
  if (isExported) score += 30
  
  return Math.min(score, 100)
}

/**
 * Categorizes risk level based on score
 */
export const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score < 25) return 'low'
  if (score < 50) return 'medium'
  if (score < 75) return 'high'
  return 'critical'
}

/**
 * Formats bundle impact for display
 */
export const formatBundleImpact = (impact: BundleImpact): string => {
  return `${impact.component_name}: ${(impact.total_bytes / 1024).toFixed(1)}KB ` +
    `(${impact.percentage_of_bundle.toFixed(1)}% of bundle)`
}

/**
 * Determines if component should be flagged for analysis
 */
export const shouldFlagForAnalysis = (
  usage: ComponentUsage,
  threshold: number = 0.01  // Less than 1% of codebase
): boolean => {
  return usage.occurrence_count === 0  // Completely unused
}
