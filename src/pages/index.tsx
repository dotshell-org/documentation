import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import "./home.css"; // 👈 important

const latestDocs = [
  {
    title: "Pelo API",
    path: "/docs/apis/pelo-api",
    description: "A simple API mirror for real-time data of the Lyon TCL (public transport) network."
  },
  {
    title: "RAPTOR GTFS Pipeline",
    path: "/docs/libraries/raptor/raptor-gtfs-pipeline",
    description: "Process GTFS data with the RAPTOR pipeline"
  },
  {
    title: "Raptor-KT",
    path: "/docs/libraries/raptor/raptor-kt",
    description: "Kotlin implementation of the RAPTOR algorithm"
  },
];

export default function Home() {
  return (
    <Layout
      title="Latest Documentation"
      description="Latest Dotshell documentation updates"
    >
      <main className="home-wrapper">
        <div className="home-container">
          <h1 className="home-title">Latest Documentation</h1>

          <div className="docs-grid">
            {latestDocs.map((doc, index) => (
              <Link key={index} to={doc.path} className="doc-card">
                <div className="doc-card-inner">
                  <div className="doc-card-content">
                    <h3>{doc.title}</h3>
                    <p>{doc.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}