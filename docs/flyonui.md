FlyonUI: A Comprehensive Guide to Setup and Component ImplementationThis document provides an exhaustive technical reference for the FlyonUI library, focusing exclusively on its core setup, configuration, and the implementation of its standard, free-to-use components. It is designed to serve as a definitive knowledge base for developers and AI engineers, detailing the library's architecture, class system, and component API. Information regarding FlyonUI Pro, Figma integration, and Tailwind 'Blocks' is explicitly excluded from this guide.Part 1: FlyonUI Core Concepts & SetupThis foundational part of the report establishes the core principles, architecture, and configuration systems of FlyonUI. A thorough understanding of these concepts is a prerequisite for effectively using the components detailed in Part 2.Section 1.1: Foundational Principles of FlyonUI's Class SystemFlyonUI is architected as a semantic abstraction layer over the Tailwind CSS framework. Its primary function is to provide pre-styled component classes that consolidate long strings of utility classes into single, readable names, thereby streamlining development and improving code maintainability for common user interface elements.The Semantic Abstraction LayerThe core value proposition of FlyonUI is its ability to simplify the styling process. Without the library, creating a standard UI element like a button requires a verbose combination of Tailwind's utility classes. With FlyonUI, this is reduced to a single, semantic component class.1For instance, constructing a button manually in Tailwind CSS would look as follows:HTML<button
 class="inline-block cursor-pointer rounded-md bg-blue-500 px-4 py-3 
 text-center text-sm font-semibold uppercase text-white transition
 duration-200 ease-in-out hover:bg-blue-600">
 Button
</button>
FlyonUI abstracts this complexity into a single class:HTML<button class="btn">Button</button>
This approach demonstrates the library's objective of enhancing the developer experience by favoring convention for standard components, which makes the HTML structure cleaner and more intuitive.1The Hybrid Workflow: Component, Modifier, and Utility ClassesFlyonUI advocates for a specific, hierarchical styling methodology that combines the efficiency of component-based frameworks with the granular control of utility-first CSS. This prescribed workflow involves three distinct layers of class application.1Start with a Base Component Class: The foundation of any element is its base component class, such as btn for a button or alert for an alert. This class provides the core structure and unstyled or minimally styled defaults.HTML<button class="btn">Button</button>
Add Modifier Classes: For common stylistic or functional variations, FlyonUI provides modifier classes. These are appended to the base class to apply pre-defined variants, such as colors or sizes.HTML<button class="btn btn-primary">Button</button>
Fine-tune with Utility Classes: For specific, one-off customizations that are not covered by a modifier, developers can use standard Tailwind CSS utility classes. This allows for ultimate flexibility and control over the final appearance.HTML<button class="btn rounded-full">Button</button>
This layered methodology is a deliberate architectural choice. It addresses a common criticism of pure utility-first approaches—namely, the long and often unreadable class lists for common elements—without sacrificing the ability to make bespoke, fine-grained adjustments. FlyonUI thus acts as a "semantic organizer" for Tailwind, imposing a readable and maintainable structure on top of its powerful syntax.Modifier Classes for JavaScript InteractivityBeyond styling, FlyonUI employs special modifier classes to enable dynamic changes based on JavaScript-driven events. These modifiers, such as collapse-open:, allow developers to define styles that are conditionally applied when a component enters a specific state. For example, the collapse-open:rotate-180 class will rotate an element by 180 degrees only when its parent collapsible section is open.1HTML<button type="button" class="collapse-toggle btn btn-primary" data-collapse="#basic-collapse-heading">
  <span class="collapse-open:hidden">Collapsed</span>
  <span class="collapse-open:block hidden">Collapse</span>
  <span class="icon-[tabler--chevron-down] collapse-open:rotate-180 transition-rotate size-4 duration-300"></span>
</button>
<div id="basic-collapse-heading" class="collapse hidden w-full overflow-hidden transition-[height] duration-300">
 ...
</div>
This system provides a powerful bridge between the CSS styling layer and the JavaScript behavior layer, allowing for declarative state-based styling directly within the HTML.Section 1.2: Global ConfigurationAll global configuration for the FlyonUI library is managed directly within the project's main CSS file. This is accomplished by replacing the semicolon after the @plugin "flyonui" directive with a block of key-value pairs enclosed in curly braces {}.2CSS@import "tailwindcss";

@plugin "flyonui" {
  /* Configuration options go here */
  themes: light --default, dark --prefersdark, gourmet;
  logs: false;
}
Configuration Options Reference TableThe following table provides a comprehensive reference for all available global configuration options within the @plugin block.2OptionTypeDefault ValueDescriptionExamplethemesstring | false | 'all'light --default, dark --prefersdarkControls which built-in themes are enabled. Use --default to set the default theme and --prefersdark for the system dark mode theme. Set to false to disable all themes, or 'all' to enable all 12.themes: soft --default, luxury --prefersdark, corporate;rootstring:rootSpecifies the CSS selector where FlyonUI’s CSS variables will be applied. Useful for scoping styles to a specific part of the application, like a shadow DOM.root: "#app";includecomma-separated list(empty)Whitelists specific components to include in the final CSS build, excluding all others. This can significantly reduce file size.include: badge, dropdown, timeline;excludecomma-separated list(empty)Blacklists specific components, excluding their styles from the final CSS build.exclude: radio, chat, timeline;logsbooleantrueToggles the display of FlyonUI-related logs in the browser's developer console.logs: false;Architectural Implications of ConfigurationThe choice of a CSS-based configuration system offers simplicity, particularly for projects that do not have a complex JavaScript build pipeline. However, this approach comes with a significant trade-off regarding integration into larger, pre-existing projects. Due to its deep integration with the Preline JS library for interactive components, FlyonUI does not support Tailwind's prefix configuration option.2 The prefix option is a critical feature in Tailwind for preventing CSS class name collisions in complex applications where multiple frameworks or style libraries might be in use.This dependency on Preline JS means that developers gain access to a rich set of pre-built, interactive components (such as carousels and tree views) at the cost of sacrificing a key Tailwind feature for namespacing. Therefore, when adopting FlyonUI, a project's architectural context is paramount. For a new, self-contained application, the absence of prefixing is unlikely to be an issue. However, for integration into a large-scale enterprise application with an existing design system, the potential for style conflicts must be carefully considered.Section 1.3: The Advanced Theming SystemFlyonUI includes a powerful and flexible theming system built on CSS variables. This system allows for rapid changes to the entire application's color scheme and style properties with minimal code changes.3Enabling and Applying ThemesThemes are managed through the themes key in the CSS configuration block. By default, only the light and dark themes are enabled.3To enable additional built-in themes, such as gourmet, they must be added to the list:CSS@import "tailwindcss";

@plugin "flyonui" {
  themes: light --default, dark --prefersdark, gourmet;
}
Once a theme is enabled in the CSS, it can be applied to the entire page by adding a data-theme attribute to the <html> tag 3:HTML<html data-theme="gourmet">
  </html>
The theming system is highly modular. A theme can be applied to any specific section of a page by adding the data-theme attribute to any HTML element. Child elements within that container will inherit the specified theme, and themes can be nested without restriction, demonstrating a robust CSS variable scoping mechanism.3HTML<html data-theme="dark">
  <body>
    <div data-theme="light">
      <span data-theme="corporate">This span will use the corporate theme!</span>
    </div>
  </body>
</html>
Managing Built-in ThemesFlyonUI comes with 12 built-in themes: light, dark, black, corporate, ghibli, gourmet, luxury, mintlify, shadcn, slack, soft, and valorant.3To optimize production builds, developers should only include the themes they intend to use. To enable all themes for development or prototyping, the themes option can be set to all. Conversely, to disable all built-in themes and create a purely custom theme set, the option can be set to false.2A critical consideration when using the more stylized built-in themes is their dependency on external fonts. While the light and dark themes use the standard font-sans family, themes like corporate, gourmet, and valorant require specific Google Fonts to render correctly. These fonts must be manually linked in the HTML <head> section. Failing to include these font links is a common point of error, resulting in a visually incorrect implementation of the theme despite correct CSS configuration.3For example, to use the corporate and gourmet themes, the following links must be added:HTML<head>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
</head>
Customizing and Creating ThemesFlyonUI provides two mechanisms for theme customization: overriding existing themes and creating new ones from scratch.To customize an existing theme, a @plugin "flyonui/theme" {} block is added to the CSS file. By specifying the name of a built-in theme (e.g., "light"), any CSS variables defined within this block will override the theme's default values.3CSS@import "tailwindcss";
@plugin "flyonui";

/* Customizing the built-in 'light' theme */
@plugin "flyonui/theme" {
  name: "light";
  default: true;
  --color-primary: blue;
  --color-secondary: teal;
}
To add a new custom theme, the same @plugin "flyonui/theme" {} directive is used, but with a new, unique name. A complete set of color and style variables must be defined for the theme to be fully functional.3CSS@import "tailwindcss";
@plugin "flyonui";

/* Defining a new custom theme named 'maintheme' */
@plugin "flyonui/theme" {
  name: "maintheme";
  default: true;
  color-scheme: light;
  --color-primary: oklch(72.17% 0.1767 305.5);
  --color-primary-content: oklch(94.64% 0.0327 307.17);
  --color-secondary: oklch(66.8% 0.0184 304.67);
  --color-base-100: oklch(98.8% 0.0069 304.24);
  /*... and all other required color and style variables */
  --radius-box: 0.5rem;
  --border: 1px;
}
Section 1.4: The Semantic Color SystemThe foundation of FlyonUI's theming capability is its semantic color system. This system abstracts color definitions away from literal values (e.g., bg-red-500) and towards semantic, role-based names (e.g., bg-primary).4Core Principle: Abstracting Color IntentBy using semantic color names like primary, secondary, accent, info, success, warning, and error, developers describe the purpose of a color rather than its specific hue. The actual color value is then dynamically supplied by the active theme's CSS variables. This abstraction is what allows for seamless theme switching; changing the theme automatically updates the colors for all elements using these semantic classes, ensuring a consistent and scalable design system.4Semantic Color Utility API ReferenceFlyonUI's semantic colors integrate directly into Tailwind's existing utility class API. This means they can be used with any utility that accepts a color name, providing a consistent and intuitive developer experience.4Utility PatternExamplePurposebg-{COLOR_NAME}bg-primaryBackground Colortext-{COLOR_NAME}text-secondaryText Colorborder-{COLOR_NAME}border-accentBorder Colorshadow-{COLOR_NAME}shadow-primaryBox Shadow Colorring-{COLOR_NAME}ring-infoRing Colorfill-{COLOR_NAME}fill-successSVG Fill Colorstroke-{COLOR_NAME}stroke-warningSVG Stroke Coloraccent-{COLOR_NAME}accent-errorForm Accent Colorfrom-{COLOR_NAME}from-primaryGradient Start Colorvia-{COLOR_NAME}via-secondaryGradient Middle Colorto-{COLOR_NAME}to-accentGradient End ColorSection 1.5: JavaScript-Driven InteractivityFlyonUI follows a clear architectural pattern that separates styling from complex behavior. While simple state changes are handled by CSS modifiers, more advanced, interactive components are powered by JavaScript.1The Preline JS CoreThe JavaScript functionality for FlyonUI's most advanced components—such as the Carousel, Tree View, and Remove Element—is not bespoke. Instead, it is provided by the unstyled, headless Tailwind plugins from Preline UI.5 This is a critical architectural detail. FlyonUI acts as a styled "skin" or theme applied on top of Preline's robust JavaScript logic.This dependency has significant implications. To fully understand, customize, or debug the behavior of these interactive components, developers may need to consult the official Preline documentation. The FlyonUI documentation provides the necessary information for implementing the styled components, but the underlying logic, full range of capabilities, and potential edge cases are defined by the Preline core. All JavaScript-driven components expose their API through a global object prefixed with HS, such as HSCarousel or HSTreeView.5The JavaScript API PatternThe Preline-powered components follow a consistent, declarative API pattern for initialization and configuration.Initialization: Components are activated on an HTML element using a data-* attribute. For example, data-carousel initializes a carousel.Configuration: Component options are passed as a JSON-like object within a corresponding data-*-options attribute or directly within the main data-* attribute. This allows for declarative configuration directly in the HTML.Programmatic Control: For dynamic control, component instances can be accessed and manipulated via methods on the global HS... object.This pattern is demonstrated across multiple components:Carousel 5:Initialization: <div class="carousel" data-carousel='{"isInfiniteLoop": true}'>...</div>Programmatic Control: const carousel = HSCarousel.getInstance('#my-carousel', true); carousel.goToNext();Remove Element 6:Initialization: <button data-remove-element="#element-to-remove">...</button>Programmatic Control: const { element } = HSRemoveElement.getInstance(buttonEl, true); element.destroy();Tree View 7:Initialization: <div data-tree-view>...</div> with items marked by data-tree-view-item.Programmatic Control: const tree = HSTreeView.getInstance('#my-tree', true); const selected = tree.element.getSelectedItems();This consistent API pattern simplifies the use of complex components by keeping their configuration and control logic predictable and well-structured.Part 2: Standard Component Implementation GuideThis part serves as a comprehensive encyclopedia of FlyonUI's standard components. Each section follows a standardized format: an overview of the component's purpose, detailed implementation examples for all documented variations, and a structured API reference table.Section 2.1: Alert2.1.1 OverviewAlerts are used to convey important messages, updates, or status changes that require user attention. They can be styled with various colors and can include icons, actions, and dismissible functionality.82.1.2 Implementation and VariationsSolid AlertsSolid alerts are the standard, filled-background style. They are created using the alert class combined with a semantic color modifier like alert-primary.8HTML<div class="alert alert-primary" role="alert">
  Welcome to our platform! Explore our latest features and updates.
</div>
<div class="alert alert-success" role="alert">
  Your transaction was successful. Thank you for choosing our service!
</div>
<div class="alert alert-warning" role="alert">
  Attention! Your account security may be at risk.
</div>
<div class="alert alert-error" role="alert">
  Oops! It seems there was an unexpected error. Please try again later.
</div>
Soft AlertsSoft alerts have a lighter, tinted background and a border. This style is achieved by adding the alert-soft class.8HTML<div class="alert alert-soft alert-primary" role="alert">
  Welcome to our platform! Explore our latest features and updates.
</div>
<div class="alert alert-soft alert-success" role="alert">
  Your transaction was successful.
</div>
Outline and Dashed AlertsOutline alerts have a transparent background with a colored border, created with the alert-outline class. Adding the border-dashed utility class creates a dashed outline.8HTML<div class="alert alert-outline alert-info" role="alert">
  Stay tuned for our upcoming events and announcements.
</div>

<div class="alert alert-outline border-dashed alert-info" role="alert">
  Stay tuned for our upcoming events and announcements.
</div>
Alerts with Icons and DescriptionsAlerts can be enhanced with icons and more complex content structures, such as titles and paragraphs, for more descriptive messages.8HTML<div class="alert alert-soft alert-primary flex items-start gap-4">
  <span class="icon-[tabler--check] shrink-0 size-6"></span>
  <div class="flex flex-col gap-1">
    <h5 class="text-lg font-semibold">Server maintenance in progress</h5>
    <p>Our servers are currently undergoing maintenance. We apologize for any inconvenience caused.</p>
  </div>
</div>
Alerts with Actions and ListsAlerts can include interactive elements like buttons and links, or structured content like lists.8HTML<div class="alert alert-soft alert-primary" role="alert">
  Please read the <a href="#" class="link link-primary font-semibold">policy</a>.
  <div class="mt-4 flex gap-2">
    <button type="button" class="btn btn-primary btn-sm">Ok</button>
    <button type="button" class="btn btn-outline btn-secondary btn-sm">Cancel</button>
  </div>
</div>

<div class="alert alert-soft alert-primary flex items-start gap-4">
  <span class="icon-[tabler--info-circle] shrink-0 size-6"></span>
  <div class="flex flex-col gap-1">
    <h5 class="text-lg font-semibold">Password Requirements:</h5>
    <ul class="mt-1.5 list-inside list-disc">
      <li>Contains a minimum of 10 characters.</li>
      <li>Includes at least one special character.</li>
    </ul>
  </div>
</div>
Dismissible AlertTo make an alert dismissible, it must be integrated with the Remove Element plugin. A button with the data-remove-element attribute pointing to the alert's ID is required. The removing: modifier can be used to add a transition effect.8HTML<div class="alert alert-soft alert-primary removing:translate-x-5 removing:opacity-0 flex items-center gap-4 transition duration-300 ease-in-out" role="alert" id="dismiss-alert1">
  Dive into our platform to discover exciting new features and updates.
  <button class="ms-auto cursor-pointer leading-none" data-remove-element="#dismiss-alert1" aria-label="Close Button">
    <span class="icon-[tabler--x] size-5"></span>
  </button>
</div>
2.1.3 API Reference TableClass NameTypeDescriptionalertComponentThe primary container element for an alert.alert-softStyleApplies a soft color style with a border.alert-outlineStyleApplies an outline style with a transparent background.alert-primaryColorApplies the 'primary' semantic color.alert-secondaryColorApplies the 'secondary' semantic color.alert-infoColorApplies the 'info' semantic color.alert-successColorApplies the 'success' semantic color.alert-warningColorApplies the 'warning' semantic color.alert-errorColorApplies the 'error' semantic color.Section 2.2: Avatar2.2.1 OverviewThe Avatar component is used to represent a user or an entity, typically with an image, icon, or initials. It is highly customizable in terms of shape, size, and status indicators.92.2.2 Implementation and VariationsShapes and SizesAvatar shapes are controlled with standard Tailwind utility classes like rounded-full for circular avatars and rounded-md for rounded squares. Size is also controlled with utility classes like size-10.9HTML<div class="avatar">
  <div class="size-14 rounded-full">
    <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="avatar" />
  </div>
</div>

<div class="avatar">
  <div class="size-14 rounded-md">
    <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="avatar" />
  </div>
</div>
Placeholder AvatarsWhen an image is not available, placeholder avatars can be used. The avatar-placeholder class is added to the main avatar container. Placeholders can contain either icons or initials.9HTML<div class="avatar avatar-placeholder">
  <div class="bg-neutral text-neutral-content w-14 rounded-full">
    <span class="icon-[tabler--user] size-8"></span>
  </div>
</div>

<div class="avatar avatar-placeholder">
  <div class="bg-neutral text-neutral-content w-14 rounded-full">
    <span class="text-xl uppercase">cl</span>
  </div>
</div>
Color VariantsPlaceholder avatars can be styled with semantic colors for both solid and soft variations.9HTML<div class="avatar avatar-placeholder">
  <div class="bg-primary text-primary-content w-10 rounded-full">
    <span class="text-md uppercase">cl</span>
  </div>
</div>

<div class="avatar avatar-placeholder">
  <div class="bg-primary/10 text-primary w-10 rounded-full">
    <span class="text-md uppercase">cl</span>
  </div>
</div>
Status IndicatorsStatus indicators can be added to avatars to show user status (e.g., online, away). Modifier classes like avatar-online-top or avatar-busy-bottom position a colored dot at the top or bottom of the avatar.9HTML<div class="avatar avatar-online-top">
  <div class="w-16 rounded-full">
    <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="avatar" />
  </div>
</div>

<div class="avatar avatar-busy-bottom">
  <div class="w-16 rounded-full">
    <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="avatar" />
  </div>
</div>
Avatar GroupMultiple avatars can be grouped together using the avatar-group container. The -space-x-* utility class is used to create the overlapping effect. The pull-up class can be added to the group to create a hover animation, which works well when combined with tooltips.9HTML<div class="avatar-group pull-up -space-x-5">
  <div class="tooltip">
    <div class="tooltip-toggle avatar">
      <div class="w-13">
        <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="avatar" />
      </div>
    </div>
    <span class="tooltip-content" role="tooltip">
      <span class="tooltip-body">Jhon Doe</span>
    </span>
  </div>
  <div class="tooltip">
    <div class="tooltip-toggle avatar">
      <div class="w-13">
        <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-10.png" alt="avatar" />
      </div>
    </div>
    <span class="tooltip-content" role="tooltip">
      <span class="tooltip-body">Elliot Chen</span>
    </span>
  </div>
  <div class="avatar avatar-placeholder">
    <div class="bg-neutral text-neutral-content w-13">
      <span>+9</span>
    </div>
  </div>
</div>
2.2.3 API Reference TableClass NameTypeDescriptionavatarComponentThe main container for an avatar.avatar-groupComponentA container for grouping multiple avatars.avatar-placeholderPartA modifier for creating placeholder avatars with icons or text.pull-upStyleAdds a pull-up animation on hover to items within an avatar-group.avatar-online-topModifierShows a green dot at the top as an 'online' indicator.avatar-online-bottomModifierShows a green dot at the bottom as an 'online' indicator.avatar-away-topModifierShows a yellow dot at the top as an 'away' indicator.avatar-away-bottomModifierShows a yellow dot at the bottom as an 'away' indicator.avatar-busy-topModifierShows a red dot at the top as a 'busy' indicator.avatar-busy-bottomModifierShows a red dot at the bottom as a 'busy' indicator.avatar-offline-topModifierShows a gray dot at the top as an 'offline' indicator.avatar-offline-bottomModifierShows a gray dot at the bottom as an 'offline' indicator.Section 2.3: Badge2.3.1 OverviewBadges are small, inline elements used to display status, counts, or labels. They are highly versatile and can be styled in various ways, including solid, soft, and outline formats, and can be made dismissible to function as "chips".102.3.2 Implementation and VariationsStyles and ColorsBadges are created with the badge class. Color and style are applied with modifier classes.10Solid Badges: Use badge-{semantic-color} (e.g., badge-primary).Soft Badges: Add the badge-soft class for a lighter, tinted version.Outline Badges: Use badge-outline for a transparent badge with a colored border.HTML<span class="badge badge-primary">Primary</span>

<span class="badge badge-soft badge-primary">Primary</span>

<span class="badge badge-outline badge-primary">Primary</span>
Shapes and SizesThe default badge is rounded. A pill shape can be created by adding the rounded-full utility class. Sizes are controlled by responsive modifier classes: badge-xs, badge-sm, badge-md (default), badge-lg, and badge-xl.10HTML<span class="badge badge-primary rounded-full">Pill</span>

<span class="badge badge-secondary badge-lg">Large</span>
Advanced UsageBadges can be composed with other elements, such as icons, text, buttons, and avatars.10HTML<span class="badge size-6 rounded-full p-0">
  <span class="icon-[tabler--user]"></span>
</span>

<button class="btn btn-primary btn-soft">
  Inbox
  <span class="badge badge-primary badge-sm">+99</span>
</button>

<span class="badge badge-primary badge-lg">
  <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="John" class="size-4.5 rounded-full"/>
  John
</span>
Dismissible Badges (Chips)By integrating with the Remove Element plugin, badges can be made dismissible. This requires a button inside the badge with a data-remove-element attribute pointing to the badge's ID.10HTML<span class="badge badge-primary badge-lg removing:translate-x-5 removing:opacity-0 transition duration-300 ease-in-out" id="badge-chip-1">
  Dismissible
  <button class="icon-[tabler--circle-x-filled] size-5 min-h-0 cursor-pointer px-0" data-remove-element="#badge-chip-1" aria-label="Dismiss Button"></button>
</span>
2.3.3 API Reference TableClass NameTypeDescriptionbadgeComponentThe base class for the badge component.badge-softStyleApplies a soft, tinted color style.badge-outlineStyleApplies a transparent background with a colored border.badge-primaryColorApplies the 'primary' semantic color.badge-secondaryColorApplies the 'secondary' semantic color.badge-accentColorApplies the 'accent' semantic color.badge-infoColorApplies the 'info' semantic color.badge-successColorApplies the 'success' semantic color.badge-warningColorApplies the 'warning' semantic color.badge-errorColorApplies the 'error' semantic color.badge-xsSizeExtra small size.badge-smSizeSmall size.badge-mdSizeMedium size (default).badge-lgSizeLarge size.badge-xlSizeExtra-large size.Section 2.4: ButtonDetailed documentation for the Button component itself was not present in the analyzed materials. However, its fundamental usage can be inferred from its widespread application in the examples for other components.1 The base class is btn, which is then styled with modifiers like btn-primary for color, btn-soft for a tinted style, btn-outline for an outline style, and btn-sm or btn-lg for size.Section 2.5: Card2.5.1 OverviewThe Card component is a flexible and extensible content container. It includes options for headers, footers, images, and a wide variety of content. It is highly compositional, built from several distinct "part" classes.112.5.2 Implementation and VariationsBasic Card StructureA standard card consists of a card container with a card-body inside. The card-title and card-actions classes are used for the title and button container, respectively.11HTML<div class="card sm:max-w-sm">
  <div class="card-body">
    <h5 class="card-title mb-2.5">Welcome to Our Service</h5>
    <p class="mb-4">Discover the features and benefits that our service offers.</p>
    <div class="card-actions">
      <button class="btn btn-primary">Learn More</button>
    </div>
  </div>
</div>
Card with ImageImages can be placed at the top or bottom of a card using a <figure> element.11HTML<div class="card sm:max-w-sm">
  <figure><img src="https://cdn.flyonui.com/fy-assets/components/card/image-9.png" alt="Watch" /></figure>
  <div class="card-body">
    <h5 class="card-title mb-2.5">Apple Smart Watch</h5>
    <p class="mb-4">Stay connected, motivated, and healthy.</p>
    <div class="card-actions">
      <button class="btn btn-primary">Buy Now</button>
    </div>
  </div>
</div>
Horizontal CardThe card-side modifier class can be applied to the card container to create a horizontal layout where the image is positioned to the side of the content.11HTML<div class="card sm:card-side max-w-sm sm:max-w-full">
  <figure><img src="https://cdn.flyonui.com/fy-assets/components/card/image-7.png" alt="headphone" /></figure>
  <div class="card-body">
    <h5 class="card-title">Airpods Max</h5>
    <p>A perfect balance of high-fidelity audio and effortless magic.</p>
  </div>
</div>
Image Overlay and Glass EffectThe image-full modifier makes the image a full background for the card's content. The glass modifier can be added to create a frosted glass effect over a background image.11HTML<div class="card image-full sm:max-w-sm">
  <figure><img src="https://cdn.flyonui.com/fy-assets/components/card/image-5.png" alt="overlay image" /></figure>
  <div class="card-body">
    <h2 class="card-title text-white">Marketing</h2>
    <p class="text-white">Boost your brand's visibility.</p>
  </div>
</div>

<div class="card glass text-white sm:max-w-sm">
  <figure><img src="https://cdn.flyonui.com/fy-assets/components/card/image-1.png" alt="iphones" /></figure>
  <div class="card-body">
    <h2 class="card-title text-white">Smartphone</h2>
    <div class="card-actions">
      <button class="btn btn-warning">Buy Now</button>
    </div>
  </div>
</div>
2.5.3 API Reference TableClass NameTypeDescriptioncardComponentThe main container for a card.card-groupComponentA container for organizing multiple cards into a cohesive group.card-headerPartDefines the header section of a card.card-titlePartDefines the title within the card body.card-bodyPartThe main content area of the card.card-actionsPartA container for action elements like buttons.card-footerPartDefines the footer section of a card.card-borderStyleAdds a border to the card.glassStyleApplies a frosted glass effect to the card.card-sideModifierCreates a horizontal layout with the image on the side.image-fullModifierMakes the <figure> image a full background for the content.card-xs...card-xlSizeA set of classes to control the padding and font size of the card.Section 2.6: Carousel2.6.1 OverviewThe Carousel component, powered by Preline JS, enables the creation of interactive slideshows for navigating through images and other content. It is highly configurable through data attributes and offers a rich JavaScript API for programmatic control.52.6.2 Implementation and VariationsDefault CarouselA basic carousel requires the carousel and overflow-hidden classes on the main wrapper. The data-carousel attribute activates the JavaScript plugin. Slides are contained within a carousel-body, and each slide is a carousel-slide. Navigation controls use carousel-prev and carousel-next, while pagination uses carousel-pagination.5HTML<div class="carousel w-full overflow-hidden" data-carousel>
  <div class="carousel-body">
    <div class="carousel-slide active">
      <div class="flex h-full items-center justify-center bg-base-300 p-6">
        <p class="text-4xl">First slide</p>
      </div>
    </div>
    <div class="carousel-slide">
      <div class="flex h-full items-center justify-center bg-base-300 p-6">
        <p class="text-4xl">Second slide</p>
      </div>
    </div>
  </div>

  <button type="button" class="carousel-prev btn btn-circle absolute start-4 top-1/2 -translate-y-1/2">
    <span class="icon-[tabler--chevron-left]"></span>
  </button>
  <button type="button" class="carousel-next btn btn-circle absolute end-4 top-1/2 -translate-y-1/2">
    <span class="icon-[tabler--chevron-right]"></span>
  </button>

  <div class="carousel-pagination absolute bottom-4 start-1/2 flex -translate-x-1/2 gap-2">
    <span class="carousel-dot carousel-active:bg-primary size-2.5 cursor-pointer rounded-full bg-base-content/50"></span>
    <span class="carousel-dot carousel-active:bg-primary size-2.5 cursor-pointer rounded-full bg-base-content/50"></span>
  </div>
</div>
Multi-Slide CarouselTo display multiple slides at once, the slidesQty option is used within the data-carousel attribute. This option can be an object with responsive breakpoints to change the number of visible slides based on screen size.5HTML<div class="carousel w-full overflow-hidden" data-carousel='{
  "slidesQty": {
    "xs": 1,
    "sm": 2,
    "lg": 3
  }
}'>
  </div>
Draggable and Snap ScrollingThe carousel can be made draggable by setting isDraggable: true. For a touch-friendly, centered scrolling experience, isSnap: true can be used, which requires adding snap-x and snap-mandatory to the carousel container and snap-center to each slide.5HTML<div class="carousel" data-carousel='{"isDraggable": true}'>...</div>

<div class="carousel snap-x snap-mandatory" data-carousel='{"isSnap": true}'>
  <div class="carousel-body">
    <div class="carousel-slide snap-center">...</div>
  </div>
</div>
2.6.3 API ReferenceOptions (via data-carousel attribute)OptionTypeDefaultDescriptioncurrentIndexnumber0The initial slide index to display.isAutoPlaybooleanfalseEnables automatic slide transitions.speednumber4000The speed of autoplay in milliseconds.isInfiniteLoopbooleanfalseEnables infinite looping of slides.isCenteredbooleanfalseCenters the active slide, adding space on the sides.isSnapbooleanfalseEnables snap-point scrolling. Not compatible with isDraggable.isDraggablebooleanfalseAllows slide navigation via mouse or touch dragging.slidesQtynumber | object1Sets the number of slides to display, with optional responsive breakpoints.Methods (via HSCarousel global object)MethodDescriptionHSCarousel.getInstance(target)Retrieves the carousel instance associated with the target element.goToPrev()Navigates to the previous slide.goToNext()Navigates to the next slide.goTo(index)Navigates to a specific slide by its zero-based index.destroy()Destroys the carousel instance and removes its event listeners and attributes.Section 2.7: Chat Bubble2.7.1 OverviewChat bubbles are used to display messages in a conversational format, such as in messaging applications. The component provides a clear distinction between sender and receiver messages and can be composed with avatars, headers, and footers.122.7.2 Implementation and VariationsBasic Sender and Receiver BubblesThe fundamental structure involves a chat container with either a chat-sender or chat-receiver modifier to control the alignment. The message itself is placed within a chat-bubble element.12HTML<div class="chat chat-receiver">
  <div class="chat-bubble">Just booked tickets for our vacation!</div>
</div>

<div class="chat chat-sender">
  <div class="chat-bubble">Awesome! I can't wait!</div>
</div>
Chat with Avatar, Header, and FooterChat bubbles can be enhanced with additional information using the chat-avatar, chat-header, and chat-footer part classes.12HTML<div class="chat chat-receiver">
  <div class="chat-avatar avatar">
    <div class="size-10 rounded-full">
      <img src="https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png" alt="avatar" />
    </div>
  </div>
  <div>
    <div class="chat-header text-base-content">
      Obi-Wan Kenobi
      <time class="text-base-content/50">12:45</time>
    </div>
    <div class="chat-bubble">I started learning guitar today!</div>
    <div class="chat-footer text-base-content/50">
      Delivered
    </div>
  </div>
</div>
Chat with MediaChat bubbles can contain rich media like images, image galleries, or file attachments.12HTML<div class="chat chat-sender">
  <div class="chat-bubble">
    <div class="flex flex-col gap-4">
      Check out my new watch! 🤩
      <button class="border-base-content/30 w-52 overflow-hidden rounded-md border">
        <img src="https://cdn.flyonui.com/fy-assets/components/card/image-9.png" alt="Watch" />
      </button>
    </div>
  </div>
</div>
2.7.3 API Reference TableClass NameTypeDescriptionchatComponentThe main container for a chat message.chat-bubblePartThe container for the message content.chat-avatarPartA container for the user's avatar image.chat-headerPartA container for the message header (e.g., name, timestamp).chat-footerPartA container for the message footer (e.g., delivery status).chat-receiverModifierAligns the chat bubble for a received message (left-aligned).chat-senderModifierAligns the chat bubble for a sent message (right-aligned).Section 2.8: CollapseDetailed documentation for a dedicated Collapse component was not available in the analyzed materials. However, its core functionality is demonstrated through the collapse-open: modifier class, which is used to apply styles conditionally when a collapsible element is in an open state.1 The interactive logic is powered by the Preline JS accordion plugin, as seen in the Tree View component.7Section 2.9: Diff2.9.1 OverviewThe Diff component provides a unique way to visually compare two items, typically images or text blocks, by revealing one on top of the other with a draggable slider.132.9.2 Implementation and VariationsImage DiffThe core structure consists of a diff container with two child elements: diff-item-1 for the first image and diff-item-2 for the second. A diff-resizer element is included to provide the draggable handle.13HTML<div class="diff aspect-video">
  <div class="diff-item-1">
    <img alt="mountains" src="https://cdn.flyonui.com/fy-assets/components/diff/image-1.png" />
  </div>
  <div class="diff-item-2">
    <img alt="flowers" src="https://cdn.flyonui.com/fy-assets/components/diff/image-2.png" />
  </div>
  <div class="diff-resizer"></div>
</div>
Text DiffThe component works equally well for comparing text blocks or other HTML content.13HTML<div class="diff aspect-video">
  <div class="diff-item-1">
    <div class="bg-primary text-primary-content grid place-content-center text-7xl font-black">FlyonUI</div>
  </div>
  <div class="diff-item-2">
    <div class="bg-base-200 grid place-content-center text-7xl font-black">FlyonUI</div>
  </div>
  <div class="diff-resizer"></div>
</div>
2.9.3 API Reference TableClass NameTypeDescriptiondiffComponentThe base container for the comparison component.diff-item-1PartThe container for the first item (the "before" state).diff-item-2PartThe container for the second item (the "after" state).diff-resizerPartThe draggable handle used to control the view.Section 2.10: Indicator2.10.1 OverviewThe Indicator is a layout component used to attach a small element, such as a dot, status, or badge, to the corner of another element. It is a compositional tool for enhancing UI elements with status information or notifications.142.10.2 Implementation and VariationsBasic IndicatorThe indicator class creates a container. The element to be positioned is given the indicator-item class. Its position can be controlled with modifier classes.14HTML<div class="indicator">
  <span class="indicator-item bg-primary size-3 rounded-full"></span>
  <div class="bg-primary/10 border-primary grid place-items-center rounded-md border p-3">
    <span class="icon-[tabler--bell] text-primary size-5"></span>
  </div>
</div>
Badge and Status as IndicatorOther components, like Badge and Status, can be used as the indicator-item.14HTML<div class="indicator">
  <span class="indicator-item badge badge-primary">+999</span>
  <div class="bg-primary/10 border-primary grid place-items-center rounded-md border p-3">
    <span class="icon-[tabler--bell] text-primary size-5"></span>
  </div>
</div>

<div class="indicator">
  <span class="indicator-item status status-primary status-lg"></span>
  <div class="bg-primary/10 border-primary grid place-items-center rounded-md border p-3">
    <span class="icon-[tabler--bell] text-primary size-5"></span>
  </div>
</div>
Indicator PositionsThe position of the indicator-item is controlled by a combination of vertical (indicator-top, indicator-middle, indicator-bottom) and horizontal (indicator-start, indicator-center, indicator-end) modifier classes.14HTML<div class="indicator">
  <span class="indicator-item indicator-top indicator-start badge badge-secondary">top+start</span>
  <span class="indicator-item indicator-bottom indicator-end badge badge-secondary">bottom+end</span>
  <div class="bg-base-300 grid h-32 w-60 place-items-center">content</div>
</div>
2.10.3 API Reference TableClass NameTypeDescriptionindicatorComponentThe container element for the indicator layout.indicator-itemPartThe element that will be positioned on the corner of a sibling.indicator-topPlacementAligns the item vertically to the top (default).indicator-middlePlacementAligns the item vertically to the middle.indicator-bottomPlacementAligns the item vertically to the bottom.indicator-startPlacementAligns the item horizontally to the start.indicator-centerPlacementAligns the item horizontally to the center.indicator-endPlacementAligns the item horizontally to the end (default).Section 2.11: List Group2.11.1 OverviewList Groups are flexible components for displaying a series of content items. They can be simple lists, interactive lists with links or buttons, and can be integrated with form elements like checkboxes and switches.152.11.2 Implementation and VariationsBasic and Interactive ListsA basic list group is an <ul> with styled <li> elements. For interactive lists, <a> or <button> elements can be used, which support :hover, :active, and :disabled states.15HTML<ul class="border-base-content/25 divide-base-content/25 w-96 divide-y rounded-md border *:p-3">
  <li>Recent Posts</li>
  <li>Upcoming Events</li>
</ul>

<div class="border-base-content/25 divide-base-content/25 flex w-96 flex-col divide-y rounded-md border">
  <a href="#" class="link link-primary flex items-center no-underline p-3">
    <span class="icon-[tabler--activity] me-3 size-5"></span>
    Active
  </a>
  <a href="#" class="link hover:link-primary flex items-center no-underline p-3">
    <span class="icon-[tabler--link] me-3 size-5"></span>
    Link
  </a>
</div>
List with Badges and IconsList items can be enhanced with icons for context and badges for displaying counts or status.15HTML<ul class="border-base-content/25 divide-base-content/25 w-96 divide-y rounded-md border *:p-3">
  <li class="flex items-center justify-between">
    Notifications <span class="badge badge-primary rounded-full">+99</span>
  </li>
  <li class="flex items-center">
    <span class="icon-[tabler--user] text-base-content me-3 size-5"></span>
    Profile
  </li>
</ul>
List with Form ControlsList groups can be used to create structured lists of form controls like checkboxes, radios, or switches.15HTML<ul class="border-base-content/25 divide-y max-w-sm rounded-md border">
  <li>
    <label class="flex items-center gap-3 p-3 cursor-pointer">
      <input type="checkbox" class="checkbox checkbox-primary" />
      <span class="label-text text-base">Web Development</span>
    </label>
  </li>
  <li>
    <label class="flex items-center gap-3 p-3 cursor-pointer">
      <input type="checkbox" class="switch switch-primary" checked />
      <span class="label-text text-base">Certified ScrumMaster</span>
    </label>
  </li>
</ul>
Section 2.12: LoadingThe navigation structure indicates the existence of a Loading component, but no specific implementation details or examples were available in the analyzed materials.16Section 2.13: Progress2.13.1 OverviewThe Progress component is used to display the progress of a task or process. It is available in both horizontal and vertical orientations and is highly customizable in terms of color, size, and style.172.13.2 Implementation and VariationsHorizontal and Vertical ProgressThe default progress bar is horizontal. The progress-vertical modifier class changes the orientation to vertical. The width (for horizontal) and height (for vertical) of the progress is set using w-* and h-* utility classes on the inner progress-bar element.17HTML<div class="progress w-56" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-bar w-1/2"></div>
</div>

<div class="progress progress-vertical h-56" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-bar h-1/2"></div>
</div>
Colors and StylesSemantic colors are applied using progress-{semantic-color} classes on the progress-bar element. Striped and animated styles are available via the progress-striped and progress-animated modifiers.17HTML<div class="progress w-56" role="progressbar" aria-valuenow="75">
  <div class="progress-bar progress-success w-3/4"></div>
</div>

<div class="progress w-56" role="progressbar" aria-valuenow="75">
  <div class="progress-bar progress-info progress-striped progress-animated w-3/4"></div>
</div>
Indeterminate ProgressFor tasks where the progress is unknown, the progress-indeterminate modifier can be used to create a loading animation.17HTML<div class="progress w-56">
  <div class="progress-bar progress-indeterminate progress-primary"></div>
</div>
2.13.3 API Reference TableClass NameTypeDescriptionprogressComponentThe base container for the progress component.progress-barPartThe inner element that represents the progress value.progress-verticalDirectionAligns the progress bar vertically.progress-stripedStyleAdds a striped background to the progress bar.progress-animatedStyleAdds a moving animation to the striped background.progress-indeterminateStyleCreates a progress bar for tasks with an unknown duration.progress-primaryColorApplies the 'primary' semantic color to the progress bar.progress-successColorApplies the 'success' semantic color to the progress bar.Section 2.14: Radial Progress2.14.1 OverviewThe Radial Progress component provides a circular visualization of progress, commonly used for displaying percentages or statistics in a compact format. It is configured primarily through inline CSS variables.182.14.2 Implementation and VariationsBasic Radial ProgressA radial progress element is created with the radial-progress class. Its completion percentage is set using the --value CSS variable. Text or numbers can be placed inside the <div> element.18HTML<div class="radial-progress" style="--value:75;" role="progressbar">75%</div>
Custom Size and ThicknessThe size and thickness of the ring are controlled by the --size and --thickness CSS variables, respectively.18HTML<div class="radial-progress" style="--value:70; --size:12rem; --thickness: 2rem;" role="progressbar">
  70%
</div>
ColorsColors are applied using standard Tailwind text-* utility classes for the progress ring and bg-* classes for the background fill.18HTML<div class="radial-progress text-success" style="--value:70;" role="progressbar">70%</div>

<div class="radial-progress bg-primary text-primary-content border-4 border-primary" style="--value:70;" role="progressbar">
  70%
</div>
2.14.3 API ReferenceThe Radial Progress component is primarily controlled via CSS variables set in the style attribute.Variable/AttributeTypeDescription--valuenumberSets the progress percentage (0-100).--sizestringSets the diameter of the component (e.g., 12rem). Defaults to 5rem.--thicknessstringSets the thickness of the progress ring (e.g., 1rem, 10%). Defaults to 10% of the size.role="progressbar"stringHTML attribute for accessibility.Section 2.15: Remove Element2.15.1 OverviewRemove Element is not a visual component but a JavaScript-powered utility plugin from Preline that adds "dismissible" behavior to other elements. It is activated by a single click on a trigger element.62.15.2 ImplementationTo use the plugin, a trigger element (typically a button) is given the data-remove-element attribute. The value of this attribute must be a CSS selector (usually an ID) pointing to the target element that should be removed. A custom removal animation can be defined using the removing: modifier on the target element.6HTML<div class="card removing:opacity-0 removing:translate-x-5 transition duration-300" id="card-to-dismiss">
  <div class="card-header flex justify-between items-center">
    <span class="card-title">Remove Card</span>
    <button data-remove-element="#card-to-dismiss" aria-label="Close Button">
      <span class="icon-[tabler--x]"></span>
    </button>
  </div>
  <div class="card-body">
    <p>This card will be removed on click.</p>
  </div>
</div>
2.15.3 API ReferenceOptions (via Data Attributes)AttributeDescriptiondata-remove-elementA CSS selector for the target element to be removed.data-remove-element-optionsA JSON object for advanced options, such as {"removeTargetAnimationClass":"translate-x-5"} to specify an animation class.Methods (via HSRemoveElement global object)MethodDescriptionHSRemoveElement.getInstance(target)Retrieves the plugin instance associated with the trigger element.destroy()Destroys the plugin instance, removing its event listeners.Section 2.16: SkeletonThe navigation structure indicates the existence of a Skeleton component, likely for creating loading placeholders, but no specific implementation details were available in the analyzed materials.16Section 2.17: Stack2.17.1 OverviewThe Stack component is a layout tool used to place elements on top of each other, creating a z-index stacking effect. It is useful for displaying layered images, cards, or notifications.192.17.2 Implementation and VariationsBasic StackElements are stacked by wrapping them in a container with the stack class. The children will overlap in the order they appear in the DOM.19HTML<div class="stack h-20 w-32">
  <div class="bg-primary text-primary-content grid place-content-center rounded-sm">1</div>
  <div class="bg-success text-success-content grid place-content-center rounded-sm">2</div>
  <div class="bg-warning text-warning-content grid place-content-center rounded-sm">3</div>
</div>
Animated StackThe stack-animated modifier adds a hover effect that fans out the stacked items, providing a simple and elegant interaction.19HTML<div class="stack stack-animated h-20 w-32">
  <div class="card border-base-content border">...</div>
  <div class="card border-base-content border">...</div>
  <div class="card border-base-content border">...</div>
</div>
2.17.3 API Reference TableClass NameTypeDescriptionstackComponentThe container that stacks its direct children.stack-animatedStyleAdds an animation to the stack on hover.Section 2.18: Stat2.18.1 OverviewThe Stat component is designed to display statistics and key data points in a visually appealing and organized manner. It is a compositional component with several parts for the title, value, description, and an optional figure.202.18.2 Implementation and VariationsBasic StatA stats container holds one or more stat items. Each stat item can contain a stat-title, stat-value, and stat-desc.20HTML<div class="stats">
  <div class="stat">
    <div class="stat-title">Total Emails Sent</div>
    <div class="stat-value">76,250</div>
    <div class="stat-desc">18% more than last month</div>
  </div>
</div>
Stat with FigureAn icon or avatar can be added using the stat-figure part.20HTML<div class="stats">
  <div class="stat">
    <div class="stat-figure text-success">
      <span class="icon-[tabler--users-group] size-8"></span>
    </div>
    <div class="stat-title">New Signups</div>
    <div class="stat-value">1.2K</div>
    <div class="stat-desc">12% increase this month</div>
  </div>
</div>
Vertical and Responsive LayoutBy default, stats are horizontal. The stats-vertical modifier arranges them in a column. Responsive classes like max-sm:stats-vertical can be used to switch from horizontal to vertical on smaller screens.20HTML<div class="stats stats-vertical lg:stats-horizontal">
  <div class="stat">...</div>
  <div class="stat">...</div>
</div>
2.18.3 API Reference TableClass NameTypeDescriptionstatsComponentThe container for a group of stat items.statPartRepresents a single stat item.stat-titlePartThe title or label for the stat.stat-valuePartThe main numerical value of the stat.stat-descPartAdditional descriptive text for the stat.stat-figurePartA container for an icon, image, or avatar.stat-actionsPartA container for action elements like buttons.stats-verticalDirectionArranges stat items in a vertical layout.Section 2.19: Status2.19.1 OverviewThe Status component is a small, circular icon used to indicate the state of an element, such as online, offline, success, or error. It is often used in composition with other components like Avatars or as an Indicator.212.19.2 Implementation and VariationsBasic Status and SizesThe component is created with the status class. Size is controlled with modifiers like status-xs, status-sm, etc..21HTML<span class="status status-lg"></span>
Colors and AnimationsSemantic colors are applied with status-{semantic-color} classes. The component can be animated with standard Tailwind animation utilities like animate-ping or animate-pulse to draw attention.21HTML<div class="status status-success"></div>

<div class="inline-grid *:[grid-area:1/1]">
  <div class="status status-error animate-ping"></div>
  <div class="status status-error"></div>
</div>
2.19.3 API Reference TableClass NameTypeDescriptionstatusComponentThe base class for the status indicator.status-primaryColorApplies the 'primary' semantic color.status-successColorApplies the 'success' semantic color.status-warningColorApplies the 'warning' semantic color.status-errorColorApplies the 'error' semantic color.status-xs...status-xlSizeA set of classes to control the size of the status dot.Section 2.20: Swap2.2.1 OverviewThe Swap component allows for toggling the visibility between two child elements. It can operate in a CSS-only mode using a hidden checkbox or in a JavaScript-driven mode by toggling a class.222.2.2 Implementation and VariationsCSS-Only Swap (with Checkbox)The component is wrapped in a <label class="swap">. An <input type="checkbox" /> controls the state. The two elements to be swapped are given the classes swap-on (visible when checked) and swap-off (visible when unchecked).22HTML<label class="swap">
  <input type="checkbox" />
  <span class="swap-off">OFF</span>
  <span class="swap-on">ON</span>
</label>
Swap with EffectsThe swap-rotate and swap-flip modifiers can be added to the swap container to apply a rotation or flip animation during the transition.22HTML<label class="swap swap-rotate">
  <input type="checkbox" />
  <span class="swap-on icon-[tabler--sun]"></span>
  <span class="swap-off icon-[tabler--moon]"></span>
</label>
JavaScript-Driven SwapFor programmatic control, the swap-js class is used on the container. The swap is then triggered by adding or removing the swap-active class with JavaScript.22HTML<label class="swap swap-js text-6xl" id="my-swap">
  <span class="swap-on">🥵</span>
  <span class="swap-off">🥶</span>
</label>

<script>
  document.getElementById('my-swap').addEventListener('click', (event) => {
    event.currentTarget.classList.toggle('swap-active');
  });
</script>
2.2.3 API Reference TableClass NameTypeDescriptionswapComponentThe base class for the swap component (checkbox-driven).swap-jsComponentBase class for a JavaScript-driven swap component.swap-onPartThe child element visible when the swap is active/checked.swap-offPartThe child element visible when the swap is inactive/unchecked.swap-rotateStyleAdds a rotation effect to the transition.swap-flipStyleAdds a flip effect to the transition.swap-activeStateThe class to add/remove to activate a swap-js component.Section 2.21: Theme Controller2.2.1 OverviewThe Theme Controller is a special-purpose component that allows users to change the active theme of the page. It cleverly uses CSS and form inputs (checkbox or radio) to set the data-theme attribute on the root element without requiring JavaScript for its basic functionality.232.2.2 Implementation and VariationsBasic Theme ToggleA simple theme toggle can be created with a single checkbox. The theme-controller class is applied to the input, and its value attribute is set to the name of the theme to activate when checked.23HTML<input type="checkbox" value="dark" class="switch theme-controller" />
Multi-Theme SelectorRadio buttons can be used to select from a list of multiple enabled themes. Each radio input has the theme-controller class and a value corresponding to a theme name.23HTML<div class="join">
  <input type="radio" name="theme-buttons" class="btn theme-controller join-item" aria-label="Default" value="default" checked />
  <input type="radio" name="theme-buttons" class="btn theme-controller join-item" aria-label="Corporate" value="corporate" />
  <input type="radio" name="theme-buttons" class="btn theme-controller join-item" aria-label="Gourmet" value="gourmet" />
</div>
Integration with Other ComponentsThe theme-controller can be integrated into other components like Swap or Dropdown for a more polished user experience.23HTML<label class="swap swap-rotate">
  <input type="checkbox" value="dark" class="theme-controller" />
  <span class="swap-off icon-[tabler--sun]"></span>
  <span class="swap-on icon-[tabler--moon]"></span>
</label>
Persisting Theme ChoiceWhile the CSS-only approach works per session, persisting the user's theme choice across page reloads requires JavaScript. The documentation recommends using the external theme-change library, which reads the state of the controller and saves the selected theme to localStorage.232.2.3 API Reference TableClass NameTypeDescriptiontheme-controllerComponentApplied to a checkbox or radio input to enable theme switching. The value of the input determines the theme.Section 2.22: Timeline2.2.1 OverviewThe Timeline component is used to display a series of events in chronological order. It supports both horizontal and vertical layouts and can be styled with icons and boxed content.242.2.2 Implementation and VariationsVertical TimelineThe core structure is a <ul> with the timeline and timeline-vertical classes. Each <li> represents an event. Inside the <li>, content is positioned using timeline-start, timeline-middle (for the icon/dot), and timeline-end. An <hr /> element is used to draw the connecting line.24HTML<ul class="timeline timeline-vertical">
  <li>
    <div class="timeline-start">1984</div>
    <div class="timeline-middle">
      <span class="badge badge-primary size-4.5 rounded-full p-0">...</span>
    </div>
    <div class="timeline-end timeline-box">Macintosh PC</div>
    <hr/>
  </li>
  <li>
    <hr/>
    <div class="timeline-start">1998</div>
    <div class="timeline-middle">...</div>
    <div class="timeline-end timeline-box">iMac</div>
    <hr/>
  </li>
</ul>
Centered and Responsive TimelineFor a more complex layout with content on alternating sides, the timeline-centered modifier is used. The component also has responsive modifiers like max-md:timeline-compact to collapse the timeline to a single side on smaller screens, ensuring readability.24HTML<ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical timeline-centered">
  <li>
    <div class="timeline-middle">...</div>
    <div class="timeline-start md:text-end mb-10">
      <time class="font-mono italic">2022</time>
      <div class="text-lg font-black">Event One</div>
      Content for event one.
    </div>
    <hr/>
  </li>
  <li>
    <hr/>
    <div class="timeline-middle">...</div>
    <div class="timeline-end mb-10">
      <time class="font-mono italic">2023</time>
      <div class="text-lg font-black">Event Two</div>
      Content for event two.
    </div>
    <hr/>
  </li>
</ul>
2.2.3 API Reference TableClass NameTypeDescriptiontimelineComponentThe main container for the timeline.timeline-startPartPositions content at the start of the timeline axis.timeline-middlePartPositions content in the middle of the axis (for icons/dots).timeline-endPartPositions content at the end of the timeline axis.timeline-verticalDirectionRenders the timeline in a vertical orientation.timeline-horizontalDirectionRenders the timeline in a horizontal orientation.timeline-boxModifierApplies a card-like box style to timeline-start or timeline-end.timeline-centeredModifierCreates a layout with content on alternating sides of the axis.timeline-compactModifierForces all timeline items to one side (for responsive layouts).Section 2.23: Tree View2.2.1 OverviewThe Tree View component, powered by Preline JS, is designed for displaying and navigating hierarchical data structures, like file directories. It supports expanding/collapsing nodes, multi-selection, and can be integrated with drag-and-drop libraries.72.2.2 ImplementationThe Tree View is initialized with the data-tree-view attribute on a wrapper element. Each item in the tree requires a data-tree-view-item attribute containing a JSON object that defines its value and whether it is a directory (isDir: true). The component internally uses the Accordion plugin for its expand/collapse functionality.7HTML<div id="tree-view" role="tree" data-tree-view>
  <div class="accordion-item" role="treeitem" data-tree-view-item='{"value": "assets", "isDir": true}'>
    <div class="accordion-heading">
      <button class="accordion-toggle">...</button>
      <span class="icon-[tabler--folder]"></span>
      <span>assets</span>
    </div>
    <div class="accordion-content">
      <div role="treeitem" data-tree-view-item='{"value": "image.png", "isDir": false}'>
        <span class="icon-[tabler--file]"></span>
        <span>image.png</span>
      </div>
    </div>
  </div>
</div>
2.2.3 API ReferenceOptions (via data-tree-view and data-tree-view-item attributes)OptionLocationDescriptioncontrolBydata-tree-viewSets the interaction mode. Can be button (default) or checkbox.autoSelectChildrendata-tree-viewIf true and controlBy is checkbox, selecting a parent directory also selects all its children.valuedata-tree-view-itemThe unique value of the item, returned by getSelectedItems().isDirdata-tree-view-itemA boolean indicating if the item is a directory (true) or a file (false).Methods (via HSTreeView global object)MethodDescriptionHSTreeView.getInstance(target)Retrieves the Tree View instance associated with the target element.getSelectedItems()Returns an array of the values of all selected items.update()Manually updates the tree, useful after dynamic changes like drag-and-drop.destroy()Destroys the Tree View instance and its event listeners.ConclusionsThe analysis of the FlyonUI documentation reveals a well-architected component library that serves as a powerful semantic layer on top of Tailwind CSS. Its core strength lies in its hybrid approach, which successfully merges the rapid development of component-based systems with the granular control of utility-first frameworks. The prescribed workflow—starting with a base component, adding modifiers, and fine-tuning with utilities—provides a clear and maintainable methodology for building user interfaces.The theming and color systems are particularly robust. By abstracting color definitions into semantic roles (primary, success, etc.), FlyonUI enables effortless and consistent theme switching. The ability to define and customize themes directly within CSS using @plugin directives offers a simple yet powerful configuration mechanism.A critical architectural characteristic of FlyonUI is its dependency on the Preline JS library for all advanced, interactive components. This is a significant trade-off: developers gain access to a rich suite of pre-built, accessible components like carousels and tree views, but they inherit Preline's architectural constraints. The most notable of these is the inability to use Tailwind's prefix option, which can pose a challenge when integrating FlyonUI into large, complex projects where CSS namespacing is crucial.In summary, FlyonUI is an excellent choice for projects that can operate within its architectural boundaries. It excels at accelerating development by providing a comprehensive set of beautifully styled, compositional, and interactive components. Developers adopting the library should be mindful of its external font dependencies for certain themes and the implications of its reliance on Preline JS, particularly regarding the lack of class prefixing. For its intended use case, FlyonUI offers a highly productive and elegant solution for building modern web interfaces with Tailwind CSS.