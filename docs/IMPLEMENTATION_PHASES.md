### Phase 1: Core Infrastructure
1) Set up project structure and build tools - [x]
2) Implement basic video detection and pause events - [x]
3) Make it so that seeking in videos doesn't get flagged as pausing and resuming the video once it loads - [x]
4) Create simple screenshot capture functionality - [x]
5) Set up Express.js server with health endpoint - [x]

### Phase 2: AI Integration
1) Create image analysis endpoint for extension to send image to server for analysis - [x]
2) Implement OpenAI service integration for analyzing received image using OpenAI's API on server - [x]
3) Create a solid prompt to get relevant product information from images in a solid JSON format from OpenAI model - [x]
4) Return JSON from server to extension and interpret - [x]
5) Add basic error handling - [x]

### Phase 3: Amazon Integration
1) Functionality to construct a search string used to search Amazon.com for products based on the JSON response from server - [x]
2) Perform Amazon.com search using constructed search string - [x]
3) Scrape the search result for the top 5 (or less if less than 5 products are returned) product results. Get their product pages and thumbnail images. Keep them ordered - [x]

### Phase 4: UI Development
1) Upon pause, have a square with rounded corners slide in from the right side of the screen (still with a decent margin from the top-right corner), stopping on the top-right corner of the screen. The dark square will have a loading animation showing the user that the screenshot is being processed - [x]
2) Once loaded, the square will duplicate itself into N number of squares, sliding down vertically into a neatly stacked set of squares along the right side of the screen. N is the number of products found for the particular product category - [x]
3) The top search result for each product type found should have its thumbnail image displayed in its respective square - [x]
4) When a box displaying a product is clicked by the user, it should expand left horizontally into 1-5 new squares showing all of the products found for this particular product category along with their respective thumbnail. These squares should be slightly smaller than the original - [ ]
5) Clicking one of the expanded squares should open the Amazon.com link to that particular product page - [ ]
