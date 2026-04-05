const buildSearchWhere = (search, fields = []) => {
  if (!search || fields.length === 0) {
    return {
      where: "",
      params: []
    };
  }

  const searchQuery = `%${search}%`;
  const conditions = fields.map(f => `${f} LIKE ?`).join(" OR ");

  return {
    where: `WHERE ${conditions}`,
    params: fields.map(() => searchQuery)
  };
};

module.exports = { buildSearchWhere };