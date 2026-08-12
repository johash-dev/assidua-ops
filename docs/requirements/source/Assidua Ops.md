
This document contains only the summary of the requirements. In-depth requirement gathering should be done through a grilling session.

## Roles

- Admin (read/write access through out the application) : 3
	- admin
	- director technical
	- director finance
- Department heads (read/write access for specific department job management) : 6
- Front desk  (read/write access for job creation): 1
- Coordinators (view access only) : 3 
- Technicians (no role in MVP) : 11

## Main Departments / Categories / Sub Categories

- Rivon
	- Car
- Rover
	- Bike
- Assidua
	- A/C
	- UPS
	- Smart Board
	- Home Appliances
		- Tv
		- Washing Machine
		- Fridge



## Required Business Flow

1. Customer calls the frontdesk to make an inquiry about a service job.
2. Frontdesk user create a customer or use an existing customer.
3. Capture issue, priority and location and submit the service job.
4. System derives department and create a new job with status:New.
5. Notify department head in app and email.
6. Department head assign a technician to the job.
7. Job information will be sent to the technician as a shareable link where the technician can view the information and update the job status.
8. Admin can oversight all departments and jobs

## Suggested Job Statuses

- New
- Assigned
- In Progress
- Resolved
- On Hold
- Cancelled
- Closed
- Reopened

## Misc Business Rules

- Job critical time period should be 10 days. (default period is 10 days, but should be configurable via department head)
	- If the job has not been processed shy 2 days before the deadline, system should prompt the user about the job/jobs that need to prioritize.


## Misc Requirements

- Comprehensive audit log to capture data changes and view them as a report.
- Generate a weekly report regarding the jobs (manual/auto). Should be sent to email inbox after generation.

