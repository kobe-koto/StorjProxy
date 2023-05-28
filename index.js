/* Config Start */
const 
      Endpoint    = "link.storjshare.io",
      AccessKeyID = "jvxlx2yv5uctti2kojl6zeniwd4a",
      BucketID    = "koto-cc-bucket-us",
      UseOrigin   = false;
/* Config End */




const ShareURL = `https://${Endpoint}/s/${AccessKeyID}/${BucketID}`;

const InjectCSS = `
    * {
        transition: all 0.3s ease;
    }
    body {
        min-height: 100vh;
        background: #F9FAFC;
    }
    footer {
        display: none;
    }

    .navbar .d-done {
        display: none;
    }
    .directory-link .row {
        border-radius: 8px !important;
    }

    .container-fluid .row .sidebar {
        display: none !important;
    }

    .breadcrumbs > span.list-desc {
        opacity: 0.65;
    }
    .container-fluid > p {
        display: none;
    }

    .container-fluid .row .content .row.justify-content-center > div * {
        margin: 0 !important;
    }


    @media (min-width: 768px) {
        .col-md-5, .col-md-7, .col-lg-8 {
            -ms-flex: 1 !important;
            flex: 1 !important;
            max-width: none !important;
        }


        .container-fluid .row .content {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 100vh;
        } 
        .container-fluid .row .content .row.justify-content-center > div {
            padding-bottom: 0 !important;
        }
        .container-fluid .row .content .row.justify-content-center > div * {
            height: 95vh;
        }

        .container-fluid .row .content .row.pt-4.pb-2 {
            display: block;
        }


        .container-fluid .row .content .row.pt-4.pb-2 > div {
            text-align: center !important;
        }
    }
`
.replace(/(\040\040|\n)/gi, "")
.replace(/\040{/gi, "{")
.replace(/\040:/gi, ":")
//.replace(/\040/gi, "")
.replace(/;}/gi, "}")

addEventListener("fetch", event => {
    event.respondWith(main(event.request));
})



async function main(request) {

    let CurrentURL = new URL(request.url);

    let NewRequestHeaders = new Headers(request.headers);
    // rewrite headers
    NewRequestHeaders.set("host", Endpoint);
    NewRequestHeaders.delete("CF-Connecting-IP");
    NewRequestHeaders.delete("CF-IPCountry");
    NewRequestHeaders.delete("CF-Ray");
    NewRequestHeaders.delete("CF-Visitor");
    NewRequestHeaders.delete("x-real-ip");
    NewRequestHeaders.delete("x-forwarded-proto");


    //console.log(NewRequestHeaders)

    let OriginalResponse = await fetch(`${ShareURL}${CurrentURL.pathname}${CurrentURL.search}`, {
        method: request.method,
        headers: NewRequestHeaders
    })

    if (NewRequestHeaders.get("Upgrade") && NewRequestHeaders.get("Upgrade").toLowerCase() === "websocket") {
        return OriginalResponse;
    }

    const { status } = OriginalResponse;

    let NewResponseHeaders = new Headers(OriginalResponse.headers);
    NewResponseHeaders.set("access-control-allow-origin", CurrentURL.host);
    NewResponseHeaders.set("access-control-allow-credentials", "true");
    NewResponseHeaders.delete("content-security-policy");
    NewResponseHeaders.delete("content-security-policy-report-only");
    NewResponseHeaders.delete("clear-site-data");

    let NewResponse;
    if ((NewResponseHeaders.get("content-type") || "").includes("text/html")) {
        let ReplacedText = await OriginalResponse.text();
        
        ReplacedText = ReplacedText.replace(/<\/head>/, "<style>" + InjectCSS + "</style></head>");

        ReplacedText = ReplacedText.replaceAll(
            `<a href="/s/${AccessKeyID}/${BucketID}/">${BucketID}</a>`, 
            `<span class="list-desc">List of</span>&nbsp;<a href="/">Root</a>`
        )
        ReplacedText = ReplacedText.replaceAll(
            `/s/${AccessKeyID}/${BucketID}/`, 
            `/`
        )
        NewResponse = ReplacedText;
    } else {
        NewResponse = OriginalResponse.body;
    }

    return new Response(NewResponse, {
        status,
        headers: NewResponseHeaders
    });
}