# sed -e '/@deleteNextLine/ { N; d; }' delete lines meeting regExg (in our case annotation: @deleteNextLine) and next
# line as well

rm pmat-globals.js
sed -e '/@deleteNextLine/ { N; d; }' pmat.api.js > pmat-globals.js;
sed -e '/@deleteNextLine/ { N; d; }' pmat.engine.js >> pmat-globals.js;
sed -e '/@deleteNextLine/ { N; d; }' pmat.util.js >> pmat-globals.js;
sed -e '/@deleteNextLine/ { N; d; }' pmat.main.js >> pmat-globals.js;