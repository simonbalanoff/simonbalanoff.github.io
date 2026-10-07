Overlay this folder onto the root of your simonbalanoff.github.io repository.

From the repository root, if the patch folder is in Downloads:

ditto ~/Downloads/simon-portfolio-fix-patch ./

Then run:

npm run build
git add .
git commit -m "Fix portfolio deployment build"
git push origin main

This patch removes the unsupported Lucide Github/Linkedin imports and updates checkout/setup-node to v5.
