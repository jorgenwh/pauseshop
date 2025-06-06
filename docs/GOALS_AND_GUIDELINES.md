We are creating a chrome extension called PauseShop.This extension should activate whenever the user pauses a video stream on Netflix, Hulu, etc. When PauseShop detects that the video stream is paused, it should take a screenshot of the paused video and send it to a back-end server (hosted by us), which then will use OpenAIs API to analyze the image for visible products such as clothing, tech gadgets, etc. The prompt used for the OpenAI model should specify a desired JSON output, adding relevant information about each product. The back-end server will then simply return this JSON with product information back to the front-end client (the PauseShop chrome extension), where the extension should search Amazon.com for products similar to those detected in the paused video using the relevant information retrieved by the OpenAI model. The extension should then scrape the Amazon.com search for the 1-5 (based on how many items are returned by Amazon's internal search) top search results for each product, and scrape their respective product page links and images. The UI should then display the images for each product search's top result vertically, and when a user clicks on a product, that vertical row should expand horizontally displaying all of the 1-5 products found for that detected product. Then, if the user clicks on any of the 1-5 products, it should open the Amazon product page for that respective image's product. Finally, when the video is resumed, the UI and any underlying processes should be terminated.

The PauseShop project should be built using TypeScript for the chrome extension as well as a node back-end server also using TypeScript.

The code must be clean and modular, and it should follow a strict standard.
It is important that the project and its code remains readable, scalable and maintainable at all times.
Development should be done in small increments, with small and concise pull requests being made for each increment.
The code should be test-driven.
Use comments conservatively, and make the code as self-describeable as possible.

## Testing Requirements

⚠️ **Important**: Extension testing can only be performed manually by the project owner. When testing is needed:

- Request manual testing from the project owner
- Do not attempt to launch browser tools or create testing environments
- Provide clear instructions on what to test and what logs to look for
- Manual testing is required to verify extension functionality on actual video streaming sites
