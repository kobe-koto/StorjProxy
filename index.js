/* Base Config Start */
const 
      Endpoint    = "link.storjshare.io",
      AccessKeyID = "jvxlx2yv5uctti2kojl6zeniwd4a",
      BucketID    = "koto-cc-bucket-us";
/* Base Config End */

/* Ext Config Start */
const 
    ExtFlags = {
        UseStaticFilesFromOrigin: false,
        StaticCDNLink: "https://static.koto.cc/StorjStatic",
        UseTweaks: true,
        HideNavBar: true,
        SortContents: true
    }
/* Ext Config End */

const ShareURL = `https://${Endpoint}/s/${AccessKeyID}/${BucketID}`;

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
    let TargetURL = `${ShareURL}${CurrentURL.pathname}${CurrentURL.search}`;

    console.log(TargetURL)

    let OriginalResponse = await fetch(TargetURL, {
        method: request.method,
        headers: NewRequestHeaders
    })

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
        
        

        if (!ExtFlags.UseStaticFilesFromOrigin) {
            ReplacedText = ReplacedText.replaceAll(
                `https://link.storjshare.io/static/`, 
                `${ExtFlags.StaticCDNLink}/`
            )
            ReplacedText = ReplacedText.replaceAll(
                `https://unpkg.com/leaflet@1.7.1/dist/`, 
                `${ExtFlags.StaticCDNLink}/leaflet@1.7.1/`
            )
            ReplacedText = ReplacedText.replaceAll(
                `https://fonts.googleapis.com/css?family=Inter:300,700`, 
                `${ExtFlags.StaticCDNLink}/GoogleFont-Inter/main.css`
            )
        }

        if (ExtFlags.UseTweaks) {
            ReplacedText = ReplacedText.replace(
                "</head>",
                `<link rel="stylesheet" href="${ExtFlags.StaticCDNLink}/tweaks.css">`
                + "</head>"
            );

            ReplacedText = ReplacedText.replaceAll(
                `<a href="/s/${AccessKeyID}/${BucketID}/">${BucketID}</a>`, 
                `<span class="list-desc">List of</span>&nbsp;<a href="/">Root</a>`
            )
        }

        if (ExtFlags.HideNavBar) {
            ReplacedText = ReplacedText.replace(
                "</head>",
                `<link rel="stylesheet" href="${ExtFlags.StaticCDNLink}/NavHider.css">`
                + "</head>"
            );
        }

        if (ExtFlags.SortContents) {
            ReplacedText = ReplacedText.replace(
                "</head>",
                `<script src="${ExtFlags.StaticCDNLink}/sort.js"></script>`
                + "</head>"
            );
        }

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