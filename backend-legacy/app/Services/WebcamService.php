<?php
/* Package symfony/panther
 * Documentation:
 * https://github.com/symfony/panther
 * https://symfony.com/doc/current/components/browser_kit.html
 * https://symfony.com/doc/current/components/dom_crawler.html
 * https://www.freecodecamp.org/news/web-scraping-with-php-crawl-web-pages/
 */

namespace App\Services;

// use Log;

/**
 * Webcam Service
 */
class WebcamService
{
    // Client options
    private $options = [
        'port' => 9517,
    ];
    private $client = null;

    public function __construct()
    {
        // for a Google Chrome use
        // $this->client = \Symfony\Component\Panther\Client::createChromeClient(null, null, $this->options);
        $this->client = \Symfony\Component\Panther\Client::createChromeClient('C:/AppServ/www/el-castillo-webapp/server/drivers/chromedriver.exe', null, $this->options);

        // for a Firefox client use the line below instead
        // $this->client = \Symfony\Component\Panther\Client::createFirefoxClient(null, null, $this->options);
        // $this->client = \Symfony\Component\Panther\Client::createFirefoxClient('C:/AppServ/www/el-castillo-webapp/server/drivers/geckodriver.exe', null, $this->options);
    }

    public function basicExample()
    {
        $url = "http://books.toscrape.com/";

        // get response
        $this->client->request('GET', $url); // Yes, this website is 100% written in JavaScript

        // take screenshot and store in current directory
        $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

        // let's display some titles
        $this->client->getCrawler()->filter('.row li article h3 a')->each(function ($node) {
            echo $node->text() . PHP_EOL;
        });
    }

    public function clickLinkExample()
    {
        $url = "https://api-platform.com/";

        // get response
        $this->client->request('GET', $url); // Yes, this website is 100% written in JavaScript

        // take screenshot and store in current directory
        $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

        // Press a link <a>
        $this->client->clickLink('Getting started');

        // Wait for an element to be present in the DOM (even if hidden)
        $crawler = $this->client->waitFor('#installing-the-framework');
        // Alternatively, wait for an element to be visible
        $crawler = $this->client->waitForVisibility('#installing-the-framework');

        // let's display some titles
        echo $crawler->filter('#installing-the-framework')->text();

        $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug
    }

    public function streamate($username, $password)
    {
        // $username = 'malubaker@studioelcastillo.com';
        // $password = 'Stud10C200';

        try {
            ini_set('max_execution_time', 300); // 300 seconds = 5 minutes
            $url = "https://www.streamatemodels.com/login";

            // get response
            $this->client->request('GET', $url); // Yes, this website is 100% written in JavaScript

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('form');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // If you need the Form object that provides access to the form properties (e.g. $form->getUri(), $form->getValues(), $form->getFields()), use this other method:
            $form = $this->client->getCrawler()->filter('form button[type="submit"]')->form();
            $form['username'] = $username;
            $form['password'] = $password;
            // submit that form
            $crawler = $this->client->submit($form);

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // wait for element to be removed from the DOM
            $this->client->waitForStaleness('form button[type="submit"]');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            ////////////
            // LOGGED //
            ////////////
            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('main iframe', 60);

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // go to another page
            $this->client->request('GET', 'https://smm.streamatemodels.com/smm/reports/earnings/EarningsReportPivot.php?lang=en&disableNavigation=true'); // Yes, this website is 100% written in JavaScript

            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('#earnings #report');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            /////////////////
            // REPORT FORM //
            /////////////////
            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('form button[id="getData"]');

            // If you need the Form object that provides access to the form properties (e.g. $form->getUri(), $form->getValues(), $form->getFields()), use this other method:
            $form = $this->client->getCrawler()->filter('form button[id="getData"]')->form();
            $form['range'] = 'week';
            // $form['earnday'] = '2024-01-04';
            // $form['earnday'] = '1234-56-78';
            // submit that form
            $crawler = $this->client->submit($form);

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('#earnings #report div');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // let's display some titles
            $totalEarning = $this->client->getCrawler()->filter('#earnings #report > div > div:nth-of-type(1) > p.lead')->text();
            $totalTime = $this->client->getCrawler()->filter('#earnings #report > div > div:nth-of-type(2) > p.lead')->text();

            $totalEarning = trim(str_replace('Total Earning:', '', $totalEarning));
            $totalTime = trim(str_replace('Total Time Online:', '', $totalTime));

            $totalEarning = str_replace('$', '', $totalEarning);

            // echo ("\e[1;32;40m\e[0m".PHP_EOL);
            // echo ("\e[0;33;40mUsuario:\e[0m            \e[1;0;40m ".$username."\e[0m".PHP_EOL);
            // echo ("\e[0;33;40mTotal Earning:\e[0m      \e[1;0;40m ".$totalEarning."\e[0m".PHP_EOL);
            // echo ("\e[0;33;40mTotal Time Online:\e[0m  \e[1;0;40m ".$totalTime."\e[0m".PHP_EOL);

            return [ 'totalEarning' => $totalEarning, 'totalTime' => $totalTime ];

        // Exception
        } catch (Exception $e) {
            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug
            throw $e;
        }
    }

    public function livejasmin($username, $password)
    {
        // $username = 'gisellemina@studioelcastillo.com';
        // $password = 'ElCastilloST2022';

        try {
            ini_set('max_execution_time', 300); // 300 seconds = 5 minutes
            $url = "https://modelcenter.livejasmin.com/es/login";

            // get response
            $this->client->request('GET', $url); // Yes, this website is 100% written in JavaScript

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('form');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // If you need the Form object that provides access to the form properties (e.g. $form->getUri(), $form->getValues(), $form->getFields()), use this other method:
            $form = $this->client->getCrawler()->filter('form button[type="submit"]')->form();
            $form['emailOrNick'] = $username;
            $form['password'] = $password;
            // submit that form
            $crawler = $this->client->submit($form);

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // wait for element to be removed from the DOM
            $this->client->waitForStaleness('form button[type="submit"]');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            ////////////
            // LOGGED //
            ////////////
            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('.mainMenuText', 60);

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // go to another page
            $this->client->request('GET', 'https://modelcenter.livejasmin.com/es/statistics/dashboard'); // Yes, this website is 100% written in JavaScript

            /////////////////
            // REPORT FORM //
            /////////////////
            // Wait for an element to be present in the DOM (even if hidden)
            $this->client->waitFor('li[data-testid="general-overview-total-earnings"]');

            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug

            // let's display some titles
            $totalEarning = $this->client->getCrawler()->filter('li[data-testid="general-overview-total-earnings"] > div > div:nth-of-type(2)')->text();
            $totalTime = $this->client->getCrawler()->filter('li[data-testid="general-overview-total-working-hours"] > div > div:nth-of-type(2)')->text();

            // echo ("\e[1;32;40m\e[0m".PHP_EOL);
            // echo ("\e[0;33;40mUsuario:\e[0m            \e[1;0;40m ".$username."\e[0m".PHP_EOL);
            // echo ("\e[0;33;40mTotal Earning:\e[0m      \e[1;0;40m ".$totalEarning."\e[0m".PHP_EOL);
            // echo ("\e[0;33;40mTotal Time Online:\e[0m  \e[1;0;40m ".$totalTime."\e[0m".PHP_EOL);

            return [ 'totalEarning' => $totalEarning, 'totalTime' => $totalTime ];

        // Exception
        } catch (Exception $e) {
            // take screenshot and store in current directory
            $this->client->takeScreenshot($saveAs = '_debug_screenshot_'.date('YmdHis').'.jpg'); // debug
            throw $e;
        }
    }
}
