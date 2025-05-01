# Bridge-Lighyear-Auth
This repository contains the "Bridge Lightyear Auth" service, a Node.js/Express application designed to receive user registration requests via an HTTP endpoint (/v1/users/register). It forwards the registration data to a RabbitMQ queue (registration-queue) for asynchronous processing. 
