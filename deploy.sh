


cat pmat.api.js > pmat-globals.js;
cat pmat.api.engine | grep -vE 'pmat\.engine\s*=\s*require|const\s*pmat=|module\.exports|export\s+const|const\s+testCases|pmat\.util\s*=\s*require' >> pmat-globals.js;
cat pmat.api.util | grep -vE 'pmat\.engine\s*=\s*require|const\s*pmat=|module\.exports|export\s+const|const\s+testCases|pmat\.util\s*=\s*require' >> pmat-globals.js;

#git init
#git remote add origin https://github.com/josuamanuel/pmat.git

git add --all .
git commit -m "Automated commit"
git push origin master

#git clone https://github.com/josuamanuel/pmat.git
