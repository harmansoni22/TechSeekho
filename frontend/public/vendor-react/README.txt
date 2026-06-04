Place local copies of the following UMD builds here:

1) react.production.min.js
   - source: https://unpkg.com/react@18/umd/react.production.min.js

2) react-dom.production.min.js
   - source: https://unpkg.com/react-dom@18/umd/react-dom.production.min.js

3) babel.min.js (babel-standalone)
   - source: https://unpkg.com/@babel/standalone/babel.min.js

Then update srcDocBuilders.js to reference these files:
- /vendor-react/react.production.min.js
- /vendor-react/react-dom.production.min.js
- /vendor-react/babel.min.js

