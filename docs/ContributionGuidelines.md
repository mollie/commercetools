## Docker

To run using a docker container, navigate to the root directory of the repository (where the Dockerfile is located) and run:
`docker build -t extension-module:latest .`

After the docker image has build, run the following to start the container:
`docker run --name extension-module -p 3000:3000 extension-module:latest`

When finished, to stop the container, run:
`docker stop extension-module`
