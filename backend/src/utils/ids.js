async function nextId(Model, prefix) {
  const docs = await Model.find({}, 'id').lean();
  let max = 0;
  docs.forEach((d) => {
    const n = parseInt(String(d.id).replace(prefix, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return prefix + (max + 1);
}

module.exports = { nextId };
