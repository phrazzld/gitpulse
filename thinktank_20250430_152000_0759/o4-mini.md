Below is a minimal‐impact change that removes the fragile `window.location.href.includes('localhost:6006')` checks, replaces them with a simple Storybook flag, and disables the expensive backdrop‐filter and CSS animations when running under Storybook.  In practice this means Storybook stays snappy, but your production Next.js app still gets its full blur/animation treatment.

1) In your `.storybook/preview.ts`, set a global that your components can read:

```diff
--- a/.storybook/preview.ts
+++ b/.storybook/preview.ts
@@ top of file
-import type { Preview } from '@storybook/react'
+import type { Preview } from '@storybook/react'

 // make a global flag so our components know they're in Storybook
+;(globalThis as any).IS_STORYBOOK = true

 import '../src/app/globals.css'

 const preview: Preview = {
   parameters: {
     backgrounds: {
       default: 'dark',
       values: [
         {
           name: 'dark',
           value: '#1b2b34', // --dark-slate
         },
         {
           name: 'darker',
           value: '#121212', // --background-secondary
         },
         {
           name: 'light',
           value: '#ffffff', // --foreground
         },
         {
           name: 'transparent',
           value: 'transparent',
         },
       ],
     },
     controls: {
       matchers: {
         color: /(background|color)$/i,
         date: /Date$/i,
       },
     },
   },
 }

 export default preview
```

2) In `AuthLoadingScreen.tsx`, read that flag and gate both the blur and the CSS animations:

```diff
--- a/src/components/ui/AuthLoadingScreen.tsx
+++ b/src/components/ui/AuthLoadingScreen.tsx
@@
 export default function AuthLoadingScreen({
   message = 'Verifying Authentication',
   subMessage = 'Please wait while we verify your credentials',
   statusMessage = 'System access verification in progress...',
   footerMessage = 'SECURE CONNECTION ESTABLISHED',
   primaryColor = '#00ff87', // --neon-green
   secondaryColor = '#3b8eea', // --electric-blue  
   textColor = '#ffffff', // --foreground
   background = 'var(--gradient-bg, linear-gradient(135deg, #121212 0%, #1b2b34 100%))',
   cardBackground = 'rgba(27, 43, 52, 0.7)',
   className = ''
 }: AuthLoadingScreenProps) {
+  // Storybook sets globalThis.IS_STORYBOOK = true
+  const isStorybook = typeof globalThis.IS_STORYBOOK !== 'undefined'

   return (
     <div 
       className={`min-h-screen flex flex-col items-center justify-center p-4 ${className}`} 
       style={{ background }}
     >
       <div 
         className="card w-full max-w-md p-8 space-y-8 border-2 rounded-md" 
         style={{ 
           backgroundColor: cardBackground,
-          // Only apply backdrop-filter in non-Storybook environments to improve performance
-          ...(typeof window !== 'undefined' && !window.location.href.includes('localhost:6006') 
-            ? { backdropFilter: 'blur(10px)' } 
-            : {}),
+          // only blur in production/real app
+          ...(!isStorybook ? { backdropFilter: 'blur(10px)' } : {}),
           boxShadow: `0 0 20px ${primaryColor}33`,
           borderColor: primaryColor
         }}
       >
@@
           <div style={{ color: secondaryColor }}>
-            <svg 
-              className={typeof window !== 'undefined' && !window.location.href.includes('localhost:6006') 
-                ? "animate-spin h-8 w-8" 
-                : "h-8 w-8"} 
+            <svg 
+              className={`${isStorybook ? '' : 'animate-spin'} h-8 w-8`} 
               xmlns="http://www.w3.org/2000/svg" 
               fill="none" 
               viewBox="0 0 24 24"
@@
             <div className="space-y-2 flex-1">
               <p 
-              className={typeof window !== 'undefined' && !window.location.href.includes('localhost:6006') 
-                ? "text-sm animate-pulse" 
-                : "text-sm"} 
+              className={`text-sm ${isStorybook ? '' : 'animate-pulse'}`}
                 style={{ color: secondaryColor }}
               >
                 &gt; {statusMessage}
@@
               <div className="flex space-x-1 text-xs mt-2" style={{ color: textColor }}>
                 <span>&gt;</span>
-              <span 
-                className={typeof window !== 'undefined' && !window.location.href.includes('localhost:6006')
-                  ? "animate-pulse" 
-                  : ""}
-              >|</span>
+                <span className={isStorybook ? '' : 'animate-pulse'}>|</span>
               </div>
             </div>
           </div>
@@
       {footerMessage && (
         <div className="text-center text-xs" style={{ color: textColor }}>
           <p>{footerMessage}</p>
           <div className="flex justify-center items-center mt-2">
             <div className="h-px w-8" style={{ backgroundColor: secondaryColor }}></div>
             <div className="px-2">•</div>
             <div className="h-px w-8" style={{ backgroundColor: secondaryColor }}></div>
           </div>
         </div>
       )}
     </div>
   </div>
 )
```

With this change:

- `IS_STORYBOOK` is always defined when running inside Storybook, so the component skips any expensive CSS blur and animations there.
- In your Next.js app (where `IS_STORYBOOK` is undefined), you still get your blur and spinning/pulsing animations as before.
- Storybook will no longer freeze or consume huge CPU cycles on these animations or the backdrop‐filter.

You don’t need to touch any of your stories—they’ll just start rendering instantly.