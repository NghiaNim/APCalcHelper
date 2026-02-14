export type APCalcBCSection = {
	id: string;
	unit: number;
	title: string;
	objectives: string[];
	commonQuestionTypes: string[];
};

export const AP_CALC_BC_SECTIONS: readonly APCalcBCSection[] = [
	{
		id: "bc-1-limits-continuity",
		unit: 1,
		title: "Limits and Continuity",
		objectives: [
			"Evaluate limits analytically and graphically",
			"Understand continuity and removable/non-removable discontinuities",
		],
		commonQuestionTypes: [
			"Limit evaluation",
			"Discontinuity classification",
			"Intermediate Value Theorem reasoning",
		],
	},
	{
		id: "bc-2-differentiation",
		unit: 2,
		title: "Differentiation: Definition and Rules",
		objectives: [
			"Connect derivative definitions to rate of change",
			"Apply product, quotient, and chain rules correctly",
		],
		commonQuestionTypes: [
			"Derivative computation",
			"Tangent line and local linearization",
			"Related rates",
		],
	},
	{
		id: "bc-3-applications-derivatives",
		unit: 3,
		title: "Applications of Derivatives",
		objectives: [
			"Analyze monotonicity and concavity",
			"Use optimization and curve sketching strategies",
		],
		commonQuestionTypes: [
			"Critical point analysis",
			"Optimization",
			"First/second derivative tests",
		],
	},
	{
		id: "bc-4-integration-accumulation",
		unit: 4,
		title: "Integration and Accumulation",
		objectives: [
			"Interpret definite integrals as accumulation",
			"Apply Fundamental Theorem of Calculus",
		],
		commonQuestionTypes: [
			"Area/accumulation interpretation",
			"Antiderivative and FTC computation",
			"Average value of a function",
		],
	},
	{
		id: "bc-5-advanced-integration",
		unit: 5,
		title: "Advanced Integration Techniques",
		objectives: [
			"Select substitution/parts/partial fractions strategies",
			"Solve separable differential equations",
		],
		commonQuestionTypes: [
			"Integration by parts",
			"Partial fractions",
			"Logistic and separable differential equations",
		],
	},
	{
		id: "bc-6-series",
		unit: 6,
		title: "Series and Taylor/Maclaurin",
		objectives: [
			"Determine convergence with standard tests",
			"Build and use Taylor/Maclaurin approximations",
		],
		commonQuestionTypes: [
			"Convergence/divergence tests",
			"Radius/interval of convergence",
			"Taylor polynomial approximation and error",
		],
	},
] as const;

const SECTION_ID_SET = new Set(
	AP_CALC_BC_SECTIONS.map((section) => section.id),
);

export const isValidSectionId = (sectionId: string): boolean => {
	return SECTION_ID_SET.has(sectionId);
};

export const getSectionById = (
	sectionId: string,
): APCalcBCSection | undefined => {
	return AP_CALC_BC_SECTIONS.find((section) => section.id === sectionId);
};
