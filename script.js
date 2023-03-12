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
const chartContainer = d3.select("#chart");
let svgWidth = d3.select("#chart").attr("width");
let svgHeight = d3.select("#chart").attr("height");
let paddings = { top: 40, right: 40, bottom: 40, left: 40 };
let chartHeight = svgHeight - paddings.top - paddings.bottom;
let chartWidth = svgWidth - paddings.left - paddings.right;

const chart = chartContainer
    .append("g")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("transform", "translate(" + paddings.left + "," + paddings.top + ")");

let city_table = d3.select("#city_table");
let city_table_data;
let xScale, xAxis;
let yScale, yAxis;

let selected_city_indexes = [0];

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

const set_title_using_city = (selected_city_indexes) => {
    console.log("set title using city", selected_city_indexes);
    let s = selected_city_indexes
        .map((i) => {
            let color = city_data[i]["color"];
            let city_name = city_data[i]["full_name"];
            let state = city_data[i]["state"];
            return `<span style="color: ${color}">${city_name}, ${state}</span>`;
        })
        .join(", ");
    title_city.classed("font-semibold", true).html(s);
};

const update_chart = (selected_city_indexes) => {
    console.log("update city table", selected_city_indexes);

    set_title_using_city(selected_city_indexes);

    city_table
        .selectAll(".city-table-row")
        .filter((d, i) => selected_city_indexes.indexOf(i) === -1)
        .classed('bg-slate-200', false)

    city_table
        .selectAll(".city-table-row")
        .filter((d, i) => selected_city_indexes.indexOf(i) !== -1)
        .classed('bg-slate-200', true)


    render_chart(selected_city_indexes);
};

const render_city_table = (city_data) => {
    const on_table_row_click = (d, i) => {
        if (selected_city_indexes.indexOf(i) !== -1) {
            selected_city_indexes = selected_city_indexes.filter(
                (x) => x !== i
            );
        } else {
            selected_city_indexes.push(i);
        }
        update_chart(selected_city_indexes);
    };
    city_table
        .selectAll(".city-table-row")
        .data(city_data)
        .enter()
        .append("div")
        .attr(
            "class",
            "city-table-row px-3 py-1.5 flex items-center hover:cursor-pointer hover:bg-gray-200 transition-all duration-300 rounded-lg hover:shadow-md"
        )
        .html(function (d) {
            return `<div class="w-3 h-3 mr-3 rounded-full bg-[${d['color']}]"></div><div class="w-3/4">${d["full_name"]}</div><div>${d["state"]}</div>`;
        })
        .on("click", on_table_row_click);
};

const render_chart = (selected_city_indexes) => {
    d3.selectAll(".xAxis").remove();
    d3.selectAll(".yAxis").remove();
    xScale = d3
        .scaleTime()
        .domain([
            city_data[0].data[0]["date"],
            city_data[0].data[city_data[0].data.length - 1]["date"],
        ])
        .range([0, chartWidth]);
    yScale = d3.scaleLinear().domain([-10, 120]).range([chartHeight, 0]);

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);
    chart
        .append("g")
        .call(xAxis)
        .attr("transform", `translate(0, ${chartHeight})`)
        .attr("class", "xAxis");
    chart.append("g").call(yAxis).attr("class", "yAxis");

    let line = d3
        .line()
        .x((d) => xScale(d["date"]))
        .y((d) => yScale(d["actual_mean_temp"]));

    const selected_city_data = selected_city_indexes.map((i) => city_data[i]);
    console.log('selected city data', selected_city_data)
    chart.selectAll("path.line").data(selected_city_data).exit().remove();
    chart
        .selectAll("path.line")
        .data(selected_city_data)
        .enter()
        .append("path")
        .attr('class', 'line')
        .attr("d", (d) => line(d.data))
        .attr("stroke", (d) => d.color)
        .attr("fill", "none");
};

(async () => {
    city_data = await read_city_data();
    console.log("city data", city_data);
    render_city_table(city_data);

    update_chart(selected_city_indexes);
})();
