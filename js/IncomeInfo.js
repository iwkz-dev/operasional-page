import { getIncomeData, getIncomePercentage } from './dataService.js';
import PieChart from './pieChart.js';
import NumberCountUp from './NumberCountUp.js';

class IncomeInfo {
  constructor() {
    const incomeChart = 'incomeChart';
    const mainTotalIncome = 'mainTotalIncome';
    const totalIncome = 'totalIncome';

    this.mainIncomeCounter = new NumberCountUp(mainTotalIncome);
    this.mainIncomeCounter.setup();

    this.totalIncomeCounter = new NumberCountUp(totalIncome);
    this.totalIncomeCounter.setup();

    this.pieChart = new PieChart(incomeChart);
    this.pieChart.setup();
  }

  run() {
    this.initIncome();
    this.initProgressBar();
  }

  getMainIncomeCounter() {
    return this.mainIncomeCounter;
  }

  getTotalIncomeCounter() {
    return this.totalIncomeCounter;
  }

  getPieChart() {
    return this.pieChart;
  }

  initIncome() {
    getIncomeData()
      .then(({ data: { data } }) => {
        const { totalIncomes, totalIncomeByTypes } = data[0];
  
        this.mainIncomeCounter.update(totalIncomes);

        this.totalIncomeCounter.update(totalIncomes);

        const pieChartData = this.extractTotalWithEachType(totalIncomeByTypes);
        this.pieChart.updateData(pieChartData);
        this.pieChart.render();
      })
  }

  initProgressBar() {
    getIncomePercentage()
      .then(({ data: { data } }) => {
        const { incomePercentage } = data[0];

        this.progressBar(incomePercentage);
      });
  }

  extractTotalWithEachType(totalIncomeByTypes) {
    const keys = Object.keys(totalIncomeByTypes);

    return keys.map((key) => ({
      y: totalIncomeByTypes[key],
      label: key,
    }));
  }

  progressBar(percentage) {
    const incomePercentage = $('#incomePercentage');
    const percentageText = $(incomePercentage).find('span');
    const percentageBar = $(incomePercentage).find('.progress-bar');

    percentageText.text(`${percentage}%`);
    percentageBar.css('width', `${percentage}%`);
    percentageBar.attr('aria-valuenow', percentage);
  }
}

export default IncomeInfo;