import fetch from "../util/fetch-fill";
import URI from "urijs";

window.path = "http://localhost:3000/records";

function buildConfig(params, primaryColors) {
  const LIMIT = 10;

  const page = params.page || 1;
  const offset = page === 1 ? 0 : (page - 1) * LIMIT;
  const colorFilter = params.colors || [];

  return {
    page,
    limit: LIMIT,
    offset,
    colorFilter,
    primaryColors,
  };
}

function buildUri(config = {}) {
  // always grab one extra to determine if this is the last page or not
  const queryParams = {
    limit: config.limit + 1,
    offset: config.offset,
  };

  if (config.colorFilter.length) queryParams['color[]'] = config.colorFilter;

  return URI(window.path).query(queryParams).toString();
}

function renderPayload(recordsPlusOne, config) {
  const records = recordsPlusOne.slice(0, config.limit);
  const openRecords = records.filter(r => r.disposition === 'open');
  const closedRecords = records.filter(r => !openRecords.includes(r));

  const ids = records.map(r => r.id);
  const open = openRecords.map((r) => ({ ...r, isPrimary: config.primaryColors.includes(r.color) }));
  const closedPrimaryCount = closedRecords.filter(r => config.primaryColors.includes(r.color)).length;

  const hasPreviousPage = config.page > 1;
  const hasNextPage = !(recordsPlusOne.length < config.limit + 1);

  const previousPage = hasPreviousPage ? config.page - 1 : null;
  const nextPage = hasNextPage ? config.page + 1 : null;

  return {
    ids,
    open,
    closedPrimaryCount,
    previousPage,
    nextPage,
  };
}

async function fetchRecords(config) {
  const response = await fetch(buildUri(config));

  let records = [];

  try {
    records = await response.json();
  } catch (error) {
    console.log(error);
  }

  return records;
}

async function retrieve(params = {}) {
  const primaryColors = ['red', 'blue', 'yellow'];
  const colorRange = [...primaryColors, 'brown', 'green'];
  const config = buildConfig(params, primaryColors);

  if (config.colorFilter.length === 1 && !colorRange.includes(config.colorFilter[0])) {
    config.page = 0;

    return renderPayload([], config);
  }

  const records = await fetchRecords(config);

  return renderPayload(records, config);
}

export default retrieve;
