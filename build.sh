# sed -e '/@deleteNextLine/ { N; d; }' delete lines meeting regExg (in our case annotation: @deleteNextLine) and next
# line as well
sed -e '/@deleteNextLine/ { N; d; }' pmat.api.js > pmat.global.js;
sed -e '/@deleteNextLine/ { N; d; }' pmat.engine.js >> pmat.global.js;
sed -e '/@deleteNextLine/ { N; d; }' pmat.util.js >> pmat.global.js;
sed -e '/@deleteNextLine/ { N; d; }' pmat.main.js >> pmat.global.js;