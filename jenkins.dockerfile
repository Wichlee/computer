# syntax=docker/dockerfile:1.4.3

# Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Aufruf:   Get-Content jenkins.dockerfile | docker run --rm --interactive hadolint/hadolint:2.10.0-beta-debian
#           docker buildx build --tag juergenzimmermann/jenkins:1.0.0 . --file jenkins.dockerfile
#           docker sbom juergenzimmermann/jenkins:1.0.0

# https://www.jenkins.io/doc/book/installing/docker
# https://manpages.debian.org/bullseye/apt/apt-get.8.en.html

FROM jenkins/jenkins:2.374-jdk17
USER root
# https://packages.debian.org/bullseye/lsb-release
# https://unix.stackexchange.com/questions/217369/clear-apt-get-list
RUN apt-get update && \
  apt-get install --no-install-recommends --yes --show-progress lsb-release=11.1.0 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
# GPG-Schluessel fuer Docker hinzufuegen
# https://www.howtoforge.de/anleitung/so-installierst-du-docker-unter-debian-11
RUN curl -fsSLo /usr/share/keyrings/docker-archive-keyring.asc \
  https://download.docker.com/linux/debian/gpg
# Docker-Repository hinzufuegen
# https://www.howtoforge.de/anleitung/so-installierst-du-docker-unter-debian-11
RUN echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/usr/share/keyrings/docker-archive-keyring.asc] \
  https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
# https://docs.docker.com/engine/install/debian/#install-from-a-package
# https://download.docker.com/linux/debian/dists/bullseye/pool/stable/amd64
# https://debian.pkgs.org/11/docker-ce-amd64
# apt-cache policy docker-ce-cli
RUN apt-get update && \
  apt-get install --no-install-recommends --yes --show-progress docker-ce-cli=5:20.10.17~3-0~debian-bullseye && \
  apt-get clean && rm -rf /var/lib/apt/lists/*
USER jenkins
# https://plugins.jenkins.io/blueocean
# https://plugins.jenkins.io/docker-workflow
RUN jenkins-plugin-cli --plugins "blueocean:1.25.8 docker-workflow:521.v1a_a_dd2073b_2e"
