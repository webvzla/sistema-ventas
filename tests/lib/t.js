// Mini marco de pruebas: cada caso queda en results/<suite>.json para el informe.
const fs = require('fs'), path = require('path');
function suite(name) {
  const R = [];
  const T = (id, desc, ok, got) => { R.push({ id, desc, ok: !!ok, got: ok ? undefined : got }); console.log((ok ? 'PASA ' : 'FALLA') + ' ' + id + ' ' + desc + (ok ? '' : '\n      ' + JSON.stringify(got))); };
  const end = () => {
    fs.mkdirSync(path.join(__dirname, '..', 'results'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '..', 'results', name + '.json'), JSON.stringify(R, null, 1));
    const ok = R.filter(r => r.ok).length;
    console.log(`\n[${name}] ${ok}/${R.length} pasan`);
    return R.every(r => r.ok);
  };
  return { T, end, R };
}
module.exports = { suite };
