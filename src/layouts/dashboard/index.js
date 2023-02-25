/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import { TextField } from "@mui/material";
import MDTypography from "components/MDTypography";
import Projects from "layouts/dashboard/components/Projects";
import { useEffect, useState } from "react";
import cryptocurrenciesJson from '../../assets/cryptocurrencies.json';
import priceDataJson from '../../assets/priceData.json';

const EMA_200_COEF = 802;
const EMA_100_COEF = 411;
const EMA_50_COEF = 200;
const EMA_20_COEF = 72;
const REFRESH_INTERVAL_MILLIS = 1000 * 60;


function Dashboard() {
  const { sales, tasks } = reportsLineChartData;
  const cryptocurrencies = cryptocurrenciesJson.currencies;
  const [processedSymbols, setProcessedSymbols] = useState({});
  const [inputCurrency, setInputCurrency] = useState('ETH');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      let promises = [];
      console.log('updating symbols:', processedSymbols, ' at: ', new Date().toLocaleTimeString())
      Object.keys(processedSymbols)?.forEach(async (symbol, value) => {
        promises.push(fetchDataBySymbol(symbol));
      });
      Promise.all(promises).then(result => {
        setTime(new Date());
      })
    }, REFRESH_INTERVAL_MILLIS);

    return () => clearInterval(interval);
  }, [processedSymbols]);

  const fetchDataBySymbol = async (symbol) => {
    const currency = cryptocurrencies.find(c => c?.symbol === symbol.toLowerCase());
    const result = await fetch(`https://api.coingecko.com/api/v3/coins/${currency.id}/market_chart?vs_currency=usd&days=90&interval=4h`).then(res => res.json());
    // const result = priceDataJson;
    const prices = result?.prices?.map(price => price[1]);

    const currentPriceResult = await fetch(`https://api1.binance.com/api/v3/ticker/price?symbol=${currency?.symbol?.toUpperCase()}USDT`).then(res => res.json());
    // const currentPriceResult = { [currency.id]: { "usd": 1603.14 } };

    const currentPrice = currentPriceResult.price;
    const EMA200 = calculateEMA(prices, EMA_200_COEF);

    setProcessedSymbols((prev) => {
      const alarmTrigger = currentPrice > EMA200 && prev.lastPrice < EMA200;
      return {
        ...prev,
        [currency.symbol]:
        {
          currentPrice: currentPrice,
          ema: EMA200,
          lastPrice: prev[currency.symbol] ? prev[currency.symbol].currentPrice : currentPrice,
          updatedAt: new Date().toLocaleString(),
          alarm: alarmTrigger,
          lastAlarmDate: alarmTrigger ? new Date().toLocaleString() : prev.lastAlarmDate
        }
      };
    });

    return { currentPrice: currentPrice, ema: EMA200, currency: currency };
  }

  useEffect(() => {
    (async () => {
      if (inputCurrency) {
        await fetchDataBySymbol(inputCurrency);
      }
    })();
  }, [inputCurrency]);

  const calculateEMA = (closingPrices, period) => {
    const k = 2 / (period + 1);
    let ema = closingPrices[0];
    for (let i = 1; i < closingPrices.length; i++) {
      ema = (closingPrices[i] * k) + (ema * (1 - k));
    }

    return ema;
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <TextField onBlur={(event) => setInputCurrency(event.target.value)} label='Add an asset' variant="outlined" />
      <MDBox>
        <Grid container >
          <Grid item xs={12} >
            <Projects rows={Object.keys(processedSymbols).map(symbol => {
              return {
                asset: <span>{symbol.toUpperCase()}</span>,
                currentPrice: (
                  <MDTypography variant="caption" color="text" fontWeight="medium">
                    <span style={{ color: processedSymbols[symbol].currentPrice > processedSymbols[symbol].lastPrice ? 'green' : 'red' }}>${processedSymbols[symbol].currentPrice}</span>
                  </MDTypography>
                ),
                lastPrice: (
                  <MDTypography variant="caption" color="text" fontWeight="medium">
                    ${processedSymbols[symbol].lastPrice}
                  </MDTypography>
                ),
                ema: (
                  <MDTypography variant="caption" color="text" fontWeight="medium">
                    ${processedSymbols[symbol].ema}
                  </MDTypography>
                ),
                updatedAt: (
                  <MDTypography variant="caption" color="text" fontWeight="medium">
                    {processedSymbols[symbol].updatedAt}
                  </MDTypography>
                ),
                alarm: (
                  <MDTypography variant="caption" color="text" fontWeight="medium">
                    {processedSymbols[symbol].alarm ? <AccessAlarmIcon size="large" /> : null}
                  </MDTypography>
                ),
                lastAlarmDate: (
                  <MDTypography variant="caption" color="text" fontWeight="medium">
                    {processedSymbols[symbol].lastAlarmDate}
                  </MDTypography>
                ),
              }
            })} />
          </Grid>
          {/* <Grid item xs={12} md={6} lg={4}>
            <OrdersOverview />
          </Grid> */}
        </Grid>
      </MDBox>
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="weekend"
                title="Cryptocurrencies"
                count={cryptocurrencies.length}
                percentage={{
                  color: "success",
                  amount: "+55%",
                  label: "than lask week",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            {/* <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="leaderboard"
                title="Today's Users"
                count="2,300"
                percentage={{
                  color: "success",
                  amount: "+3%",
                  label: "than last month",
                }}
              />
            </MDBox> */}
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            {/* <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="store"
                title="Revenue"
                count="34k"
                percentage={{
                  color: "success",
                  amount: "+1%",
                  label: "than yesterday",
                }}
              />
            </MDBox> */}
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            {/* <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="person_add"
                title="Followers"
                count="+91"
                percentage={{
                  color: "success",
                  amount: "",
                  label: "Just updated",
                }}
              />
            </MDBox> */}
          </Grid>
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="website views"
                  description="Last Campaign Performance"
                  date="campaign sent 2 days ago"
                  chart={reportsBarChartData}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="daily sales"
                  description={
                    <>
                      (<strong>+15%</strong>) increase in today sales.
                    </>
                  }
                  date="updated 4 min ago"
                  chart={sales}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="dark"
                  title="completed tasks"
                  description="Last Campaign Performance"
                  date="just updated"
                  chart={tasks}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>

      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
