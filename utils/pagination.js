const db = require("../config/db");

const getAllWithPagination = async ({
  baseQuery,
  countQuery,
  searchFields = [],
  sortMap = {},
  req
}) => {
  let {
    page = 1,
    per_page = 10,
    sortBy = "id",
    sortDir = "desc",
    search = ""
  } = req.query;

  page = parseInt(page);
  per_page = parseInt(per_page);
  const offset = (page - 1) * per_page;

  // ✅ sort
  sortBy = sortMap[sortBy] || sortMap["id"];

  const allowedDir = ["asc", "desc"];
  if (!allowedDir.includes(sortDir)) sortDir = "desc";

  let where = "";
  let params = [];

  // 🔥 FINAL SEARCH LOGIC (CLEAN)
  if (search) {
    let conditions = [];

    // ✅ ISO or DATE → search by DAY (BEST WAY)
    if (search.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(search)) {
      const date = new Date(search);
      const day = date.toISOString().slice(0, 10);

      conditions.push(`DATE(dr.created_at) = ?`);
      params.push(day);
    }

    // ✅ TEXT SEARCH
    else {
      const likeQuery = `%${search}%`;

      searchFields.forEach(f => {
        conditions.push(`${f} LIKE ?`);
        params.push(likeQuery);
      });
    }

    const conditionStr = conditions.join(" OR ");

    if (baseQuery.toLowerCase().includes("where")) {
      where = `AND (${conditionStr})`;
    } else {
      where = `WHERE ${conditionStr}`;
    }
  }

  // ✅ total
  const [[{ total }]] = await db.query(
    `${countQuery} ${where}`,
    params
  );

  // ✅ data
  const [rows] = await db.query(
    `${baseQuery} ${where} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`,
    [...params, per_page, offset]
  );

  const total_pages = Math.ceil(total / per_page);

  return {
    data: rows,
    pagination: {
      page,
      per_page,
      total,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
      next_page: page < total_pages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null
    }
  };
};

module.exports = { getAllWithPagination };