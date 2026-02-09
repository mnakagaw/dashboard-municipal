const internet = {
	total: 8999631,
	used: 7120579,
	rate_used: 0.79
};
const cellular = {
	total: 8999631,
	used: 8208848,
	rate_used: 0.91
};
const computer = {
	total: 8999631,
	used: 3195605,
	rate_used: 0.36
};
const national_tic = {
	internet: internet,
	cellular: cellular,
	computer: computer
};

export { cellular, computer, national_tic as default, internet };
