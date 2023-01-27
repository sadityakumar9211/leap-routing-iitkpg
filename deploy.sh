# making sure that we run everything to main branch
echo "Switching to the 'main' branch"
git checkout main  

echo "Building app..."
yarn build

# transfering files to the server
echo "Deploying files to the server..."
scp -r build/* aditya@45.79.127.83:/var/www/45.79.127.83/

echo "Done! 🎉"

