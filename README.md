# VAiRadiology Tasks
------------------------

* __Python Version: 3.12.3__
* __Node Version: v24.18.0__

## initiate in Local

1. __Clone from Github__

`git clone https://github.com/sudiptoshahin/radiolog-task.git`

2. __Goto project directory__
`cd radiolog-task`

3. __Backend Setup__
    * __Create env and activate__
        * `python3 -m venv env`
        * `source env/bin/activate`
    * __Install Dependencies__
        * `pip install -r requirements.txt`
    * __Copy Local env from .env.example to .env file__
        * `cp .env.example .env`
    * __Create static directory__
        * `mkdir static`
    * __Run migration__
        * `python manage.py makemigrations` (can be skipped)
        * `python manage.py migrate`
    * __Create superuser__
        * `python manage.py createsuperuser`
        * complete the superuser registration
    * __Runserver__
        * `python manage.py runserver`
    * __Goto__ `http://127.0.0.1:8000/admin/`

Then Login and create Tags for Kanaban task

4. __Frontend setup__
    *  `cd frontend`
    * `npm install`
    * __Copy Local env from .env.example to .env file__
        * `cp .env.example .env`
    * `npm run dev`


## Hosted On Vercel and Pythonanywhere
* __Frontend:__ [FRONTEND_URL](https://radiolog-task.vercel.app/)
* __Backend:__ [BACKEND_URL](https://sudiptoshahin.pythonanywhere.com/admin/)



1. __Difficultices faced for backend__


2. __Difficulties faced in frontend__