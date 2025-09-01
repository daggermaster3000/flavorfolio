# Flavorfolio 🍳

A beautiful, minimal recipe management app built with Next.js, React, and Supabase. Curate, explore, and organize your favorite recipes in a clean, stylish way.

## ✨ Features

- **🔐 Secure Authentication** - Sign up/sign in with Supabase Auth
- **📝 Recipe Management** - Create, edit, delete, and organize recipes
- **🎨 Rich Text Editor** - Beautiful recipe descriptions with TipTap
- **📸 Image Uploads** - Add photos to recipes and individual steps
- **🤖 AI Recipe Parser** - Paste TikTok links and let OpenAI extract recipe details
- **🔍 Search & Tags** - Find recipes quickly with search and tag filtering
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **📄 PDF Export** - Download your recipes as beautiful PDFs
- **🌐 Explore Feed** - Discover recipes from other users

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd flavorfolio
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with your Supabase and OpenAI credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 🤖 TikTok Recipe Parser

The app includes an AI-powered recipe parser that can extract recipe information from TikTok links:

1. Click "New Recipe" in the dashboard
2. Paste a TikTok recipe link in the "AI Recipe Parser" section
3. Click "Parse Recipe" to extract ingredients, steps, and other details
4. Review and edit the parsed information as needed
5. Save your recipe with all the extracted details

**Note:** This feature requires an OpenAI API key and will consume API credits based on usage.

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Rich Text Editor:** TipTap
- **AI Integration:** OpenAI GPT-3.5 Turbo
- **Icons:** Lucide React

## 📁 Project Structure

```
src/
├── app/
│   ├── api/           # API routes (including recipe parser)
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Auth)
│   ├── lib/           # Utility functions and Supabase client
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── globals.css        # Global styles
```

## 🚀 Development Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Start production:** `npm start`
- **Lint:** `npm run lint`
- **Type check:** `npm run type-check`

## 📚 Documentation

- **Setup Guide:** [SETUP.md](./SETUP.md) - Complete setup instructions
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Supabase](https://supabase.com/)
- Enhanced with [OpenAI](https://openai.com/)
- Icons from [Lucide](https://lucide.dev/)
