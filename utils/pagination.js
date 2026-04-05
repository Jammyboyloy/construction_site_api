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

  // ✅ map frontend → real column (IMPORTANT)
  sortBy = sortMap[sortBy] || sortMap["id"];

  const allowedDir = ["asc", "desc"];
  if (!allowedDir.includes(sortDir)) sortDir = "desc";

  const searchQuery = `%${search}%`;

  let where = "";
  let params = [];

  if (search && searchFields.length > 0) {
    const conditions = searchFields.map(f => `${f} LIKE ?`).join(" OR ");
    where = `WHERE ${conditions}`;
    params = searchFields.map(() => searchQuery);
  }

  // 🔥 total
  const [[{ total }]] = await db.query(
    `${countQuery} ${where}`,
    params
  );

  // 🔥 data
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