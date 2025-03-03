# Adaptus2-UI

Adaptus2-UI is a modern, responsive content management system (CMS) interface built with React, TypeScript, and Tailwind CSS. It provides a flexible and customizable dashboard for managing content through a dynamic form system that adapts to your data structure.

## Features

- **Dynamic Content Management**: Automatically generates forms based on your CMS configuration
- **Multiple View Types**: Table, Grid, List, and Video Gallery views for content display
- **Rich Text Editing**: Enhanced WYSIWYG editor for content creation
- **Media Management**: Support for image and video uploads with previews
- **Theming System**: Multiple built-in themes with easy customization
- **Authentication**: Secure login system with token-based authentication
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Type Safety**: Built with TypeScript for improved developer experience and code quality

## Tech Stack

- **React**: UI library for building the interface
- **TypeScript**: For type safety and improved developer experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Router**: For navigation and routing
- **React Query**: For data fetching and caching
- **React Hook Form**: For form handling and validation
- **Zod**: For schema validation
- **Zustand**: For state management
- **React Quill**: For rich text editing
- **Axios**: For API requests

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Adaptus2-Framework backend (or compatible API)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Adaptus2-ui.git
   cd Adaptus2-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your backend URL:
   ```
   ADAPTUS2_URL=http://localhost:3000
   ```

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the development server at `http://localhost:5173` (or another port if 5173 is in use).

## Building for Production

Build the application for production:

```bash
npm run build
# or
yarn build
```

Preview the production build:

```bash
npm run preview
# or
yarn preview
```

## Project Structure

```
Adaptus2-ui/
├── public/             # Static assets
├── src/
│   ├── api/            # API client and endpoints
│   ├── components/     # React components
│   │   ├── auth/       # Authentication components
│   │   ├── dashboard/  # Dashboard views
│   │   ├── forms/      # Form components and fields
│   │   ├── layout/     # Layout components
│   │   ├── theme/      # Theming components
│   │   └── VideoGallery/ # Video gallery components
│   ├── config/         # Configuration files
│   ├── store/          # State management
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── .env                # Environment variables
├── index.html          # HTML entry point
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Theming

Adaptus2-UI comes with multiple built-in themes:

- Light
- Dark
- Blue
- Green
- Purple
- Orange

Themes can be customized by editing the `src/config/themes.json` file. The application automatically detects and applies the user's preferred color scheme, but users can also manually switch between themes using the theme switcher in the dashboard header.

## Form System

The dynamic form system automatically generates forms based on your CMS configuration. It supports various field types:

- Text
- Number
- Enum (dropdown)
- File upload
- Rich text (WYSIWYG)
- Date/time
- Checkbox
- And more

Forms can be organized into tabs for better organization of complex content types.

## Authentication

The application uses token-based authentication. The token is stored in local storage and automatically included in API requests. The authentication state is managed by Zustand and persisted across page reloads.

## Error Handling

The application includes a global error boundary that catches and displays errors in a user-friendly way. API errors are also handled and displayed to the user with appropriate messages.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
