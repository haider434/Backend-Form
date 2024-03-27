const http = require('http');
const { parse } = require('querystring');

const port = 4000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      const data = JSON.parse(body);

      // recieving the monthly input to caluculate operations
      const monthlyGrossIncome = parseFloat(data.monthlyGrossIncome || 0);
      const monthlyExpenses = parseFloat(data.monthlyExpenses || 0);

      // making operations to calculate yearly expenses
      const annualGrossIncome = monthlyGrossIncome * 12;
      const annualExpenses = monthlyExpenses * 12;

      // calculation of all addbacks for sde
      const yearlyAddBacks = {
        MonthlyOwnerW2Wage: parseFloat(data.MonthlyOwnerW2Wage) * 12,
        Depreciation: parseFloat(data.Depreciation) * 12,
        Interest: parseFloat(data.Interest) * 12,
        MealsAndEntertainment: parseFloat(data.MealsAndEntertainment) * 12,
        PersonalTravel: parseFloat(data.PersonalTravel) * 12,
        OwnerHealthAndLifeInsurance: parseFloat(data.OwnerHealthAndLifeInsurance) * 12,
        Owner401k: parseFloat(data.Owner401k) * 12,
        OneTimeBusinessExpenses: parseFloat(data.OneTimeBusinessExpenses) * 12,
      };
      const totalAddBacks = Object.values(yearlyAddBacks).reduce(
        (acc, currentValue) => acc + currentValue, 0);

      //Caluculation for sde
      const MonthlySde = monthlyGrossIncome - monthlyExpenses + (totalAddBacks / 12);
      const YearlySde = MonthlySde * 12;
      //Calculations for ebida without W2
      const addBacksWithoutW2 = Object.keys(yearlyAddBacks).reduce((sum, key) => {
        if (key !== "MonthlyOwnerW2Wage") {
          return sum + yearlyAddBacks[key];
        }
        return sum;
      }, 0);
      const MonthlyEbitda = (monthlyGrossIncome - monthlyExpenses + addBacksWithoutW2 / 12);
      const YearlyEbitda = MonthlyEbitda * 12;

      //  income classification from request
      let sdeValuation = { low: 0, high: 0, average: 0 };
      let ebitdaValuation = { low: 0, high: 0, average: 0 };

      const incomeClassification = data.incomeClassification;
      if (incomeClassification === "non-recuring") {
        sdeValuation.low = YearlySde * 2.0;
        sdeValuation.high = YearlySde * 2.8;
        sdeValuation.average = (sdeValuation.low + sdeValuation.high) / 2;
        ebitdaValuation.low = YearlyEbitda * 2.5;
        ebitdaValuation.high = YearlyEbitda * 4.5;
        ebitdaValuation.average = (ebitdaValuation.low + ebitdaValuation.high) / 2;
      } else if (incomeClassification === "guaranteed-recurring") {
        sdeValuation.low = YearlySde * 3.5;
        sdeValuation.high = YearlySde * 4.5;
        sdeValuation.average = (sdeValuation.low + sdeValuation.high) / 2;
        ebitdaValuation.low = YearlyEbitda * 4.0;
        ebitdaValuation.high = YearlyEbitda * 5.0;
        ebitdaValuation.average = (ebitdaValuation.low + ebitdaValuation.high) / 2;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        annualGrossIncome,
        annualExpenses,
        yearlyAddBacks,
        MonthlySde,
        YearlySde,
        MonthlyEbitda,
        YearlyEbitda,
        sdeValuation,
        ebitdaValuation
      }));
    });
  }
});

server.listen(port, () => {
  console.log(`Server running on Port ${port}`);
});
