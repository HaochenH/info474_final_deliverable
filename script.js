const CITY_DATA_NAME = "./weather_data/cities-gps.csv";
const CITY_TABLE_NAME_COLUMN = "City Name ABR";
const EXTRA_CITY_DATA = [
    { full_name: "Seattle", state: "WA", color: "#b45309" },
    { full_name: "New York City", state: "NY", color: "#047857" },
    { full_name: "Houston", state: "TX", color: "#4f46e5" },
    { full_name: "Charlotte", state: "NC", color: "#be185d" },
    { full_name: "Los Angeles", state: "CA", color: "#7e22ce" },
    { full_name: "Indianapolis", state: "IN", color: "#b91c1c" },
    { full_name: "Jacksonville", state: "FL", color: "#2563eb" },
    { full_name: "Chicago", state: "IL", color: "#15803d" },
    { full_name: "Philadelphia", state: "PA", color: "#be123c" },
    { full_name: "Phoenix", state: "AZ", color: "#c2410c" },
];

let city_data;

let SITE_TITLE = "Some Title";

const title = d3.select("#chart-title");
const title_city = d3.select("#city");
const chart = d3.select("#chart");
let city_table = d3.select("#city_table");
let city_table_data;
let svgWidth = d3.select("#chart").attr("width");
let svgHeight = d3.select("#chart").attr("height");
let chartPaddingX = 30;
let chartPaddingT = 80;
let chartPaddingB = 80;
let chartHeight = svgHeight - chartPaddingT - chartPaddingB;
let chartWidth = svgWidth - chartPaddingX * 2;
let xScale, xAxis;
let yScale, yAxis;

function read_one_city_data(city_data_file_name) {
    d3.csv(city_data_file_name).then(function (data) {
        city_data = data;
        console.log("cities", city_data);
    });
    return;
}

const read_city_data = async () => {
    let city_table = await d3.csv(CITY_DATA_NAME);

    const data = await Promise.all(
        city_table.map((col) => {
            const file_url =
                "./weather_data/" + col[CITY_TABLE_NAME_COLUMN] + ".csv";
            return d3.csv(file_url);
        })
    );

    return city_table.map((value, index) => ({
        ...value,
        data: data[index].map((v) => ({ ...v, date: new Date(v["date"]) })),
        ...EXTRA_CITY_DATA[index],
    }));
};

const set_title_using_city = (city_index) => {
    let city_name = city_data[city_index]["full_name"];
    let state = city_data[city_index]["state"];
    let color = city_data[city_index]["color"];
    title_city
        .text(`${city_name}, ${state}`)
        .classed('font-semibold', true)
        .style("color", color);
};

const update_data_by_city = (city_index) => {
    console.log("update city: ", city_index);
    console.log(city_data[city_index]);
    set_title_using_city(city_index);
    city_table
        .selectAll(".city-table-row")
        .data([city_data[city_index]])
        .style("background-color", "blue");

    render_chart(city_index);
};

const render_city_table = (city_data) => {
    city_table = city_table
        .selectAll("div")
        .data(city_data)
        .enter()
        .append("div")
        .attr(
            "class",
            "city-table-row px-3 py-1.5 flex hover:cursor-pointer hover:bg-gray-200 transition-all duration-300"
        )
        .html(function (d) {
            return `<div class="w-3/4">${d["full_name"]}</div><div>${d["state"]}</div>`;
        })
        .on("click", function (d, i) {
            update_data_by_city(i);
        });
};

const render_chart = (city_index) => {
    let current_city_info = city_data[city_index];

    console.log("render chart");
    console.log("chart data", current_city_info.data);

    xScale = d3
        .scaleTime()
        .domain([
            current_city_info.data[0]["date"],
            current_city_info.data[current_city_info.data.length - 1]["date"],
        ])
        .range([0, chartWidth]);
    yScale = d3
        .scaleLinear()
        .domain([
            0,
            d3.max(current_city_info.data, function (d) {
                return d["actual_mean_temp"];
            }),
        ])
        .range([chartHeight, 0]);
    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);

    console.log("date x", xScale());

    let line = d3
        .line()
        .x((d) => xScale(d["date"]))
        .y((d) => yScale(d["actual_mean_temp"]));

    chart.append("path")
        .attr("d", line(current_city_info.data))
        .attr('stroke', current_city_info.color)
        .attr('fill', 'none')
};

(async () => {
    city_data = await read_city_data();
    console.log("city data", city_data);
    render_city_table(city_data);

    update_data_by_city(0);
})();
