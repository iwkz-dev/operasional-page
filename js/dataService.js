const API_URL = 'http://localhost:9001';//'https://api.alfalah.de';

const getParams = (month, year) => {
  let params = '';

  if (month) params += `month=${month}&`;
  if (year) params += `year=${year}&`;

  return params;
}

const getIncomeData = (month = null, year = null) => {
  const params = getParams(month, year);
  const url = `${API_URL}/api/income/total?${params}`;

  return axios.get(url);
};

const getBillData = (month = null, year = null) => {
  const params = getParams(month, year);
  const url = `${API_URL}/api/bill/total?${params}`;

  return axios.get(url);
};

const getIncomePercentage = (month = null, year = null) => {
  const params = getParams(month, year);
  const url = `${API_URL}/api/income/total-percentage?${params}`;

  return axios.get(url);
}

export {
  getIncomeData,
  getIncomePercentage,
  getBillData,
}