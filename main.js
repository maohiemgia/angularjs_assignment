import { dbUrl, displayErr, getIdByUrl } from "./resources/js/all.js";

let myApp = angular.module("myApp", ["ngRoute"]);

myApp.config(function ($routeProvider) {
	$routeProvider
		.when("/", {
			templateUrl: "./pages/quizlist.html",
			controller: "mainController",
		})
		.when("/quiz/:categoryId", {
			templateUrl: "./pages/quiz.html",
			controller: "quizController",
		})
		.when("/quiz/quizresult/:userId/:cateId", {
			templateUrl: "./pages/quizResult.html",
			controller: "resultController",
		})
		.when("/login", {
			templateUrl: "./pages/user/login.html",
			controller: "loginController",
		})
		.when("/profile/:userId", {
			templateUrl: "./pages/user/userprofile.html",
			controller: "viewProfileController",
		})
		.when("/notfound", {
			templateUrl: "./pages/notfound.html",
			controller: "alertController",
		})
		.when("/contact", {
			templateUrl: "./pages/lienhe.html",
		})
		.otherwise({
			redirectTo: "/",
		});
});

myApp.controller("mainController", function ($scope, $http, $rootScope) {
	$scope.logout = function () {
		let confirmLogout = confirm("Bạn chắc chắn muốn đăng xuất?");

		if (confirmLogout) {
			sessionStorage.setItem("reloadPageLogin", 1);
			sessionStorage.removeItem("loginToken");

			alert("Đăng xuất thành công!");

			location.href = "#!/login";
		}
	};

	$scope.userId = sessionStorage.getItem("loginToken");

	if ($scope.userId < 1) {
		return (location.href = "#!/login");
	}

	$rootScope.doingQuiz = false;

	// request quiz list
	let tableName = "/category";
	$http.get(dbUrl + tableName).then(
		function (response) {
			$scope.showAll = response.data;
		},
		function (response) {
			alert("Lỗi nhận data từ json!!!");
		}
	);

	tableName = "/account/" + $scope.userId;

	$http.get(dbUrl + tableName).then(
		function (response) {
			// assign progress id
			sessionStorage.setItem("bannerDisplay", "block");
			$scope.displayBanner();
			$scope.accountInfor = response.data;
		},
		function (response) {
			sessionStorage.setItem("bannerDisplay", "none");
			$scope.displayBanner();

			if ($scope.userId < 1) {
				return (location.href = "#!/login");
			}
		}
	);

	// set status display banner
	$scope.displayBanner = function () {
		let bannerDisplayStatus = "block";
		let status = sessionStorage.getItem("bannerDisplay");

		if (status == "none") {
			bannerDisplayStatus = status;
		}

		$scope.hiddenBanner = {
			display: bannerDisplayStatus,
		};
	};

	// after click -> active index clicked
	$scope.itemEachPage = 2;
	$scope.beginPage = 0;
	$scope.paginatingFunc = function (beginn) {
		// when go down out of arr index
		if (beginn < 0) {
			beginn = 0;
		}
		// when go up out of arr index
		if (beginn > $scope.showAll.length - 1) {
			beginn -= $scope.itemEachPage;
		}
		$scope.beginPage = beginn;

		// remove all class active
		let pageIndexLi = document.querySelectorAll(".pageIndexLi");
		pageIndexLi.forEach(function (ele) {
			ele.classList.remove("active");
		});
		$scope.activeIndexPage = null;

		pageIndexLi[beginn / $scope.itemEachPage + 1].classList.toggle(
			"active"
		);
	};

	// before load -> active frist index
	$scope.activeIndexPage = function () {
		let pageIndexLi = document.querySelectorAll(".pageIndexLi");

		if (pageIndexLi[1].nextElementSibling != undefined) {
			return document
				.querySelectorAll(".pageIndexLi")[1]
				.classList.add("active");
		}
	};

	// creat inforProgress
	$scope.writeCateName = function (cateObject) {
		// request data progress of user by userid
		$scope.userId = 1;
		let tableName = "/inforProgress?userId=" + $scope.userId;

		$http.get(dbUrl + tableName).then(
			function (response) {
				// assign progress id
				let checkMatching = 0;

				response.data.forEach(function (ele) {
					if (ele.categoryObject.id == cateObject.id) {
						checkMatching = 1;
						$scope.idProgress = cateObject.id;
						return;
					}
				});

				// creat new progress if the first do quiz check by quiz category
				if (checkMatching == 0) {
					$scope.newProgress = {
						userId: $scope.userId,
						categoryObject: cateObject,
						questionDetail: {
							correctQuestion: 0,
							incorrectQuestion: 0,
							totalPoint: 0,
						},
						timeSpend: 0,
					};
					$http
						.post(
							dbUrl + "/inforProgress",
							$scope.newProgress
						)
						.then(function (response) {
							return;
						}),
						function (response) {};
				}

				response.data.forEach(function (ele) {
					if (ele.categoryObject.id == cateObject.id) {
						checkMatching = 1;
						$scope.idProgress = cateObject.id;
						return;
					}
				});

				location.href = "#!/quiz/" + cateObject.id;
			},
			function (response) {
				console.log("Lỗi nhận data từ json!!!");
			}
		);
	};

	let countReload = sessionStorage.getItem("reloadPage");

	if (countReload != "reloaded") {
		location.reload();
		sessionStorage.setItem("reloadPage", "reloaded");
	}
});
myApp.controller("loginController", function ($scope, $http, $rootScope) {
	// hidden banner
	sessionStorage.setItem("bannerDisplay", "none");

	$rootScope.doingQuiz = false;

	// check user login status
	$scope.userId = sessionStorage.getItem("loginToken");

	if ($scope.userId > 0) {
		return (location.href = "#!/");
	}

	// request all account
	let tableName = "/account";

	$http.get(dbUrl + tableName).then(
		function (response) {
			// get data
			$scope.accountInfor = response.data;
			console.log($scope.accountInfor);
		},
		function (response) {
			console.log("Lỗi nhận data từ json!!!");
		}
	);

	$scope.username = "";
	$scope.password = "";

	$scope.submitLoginFunc = function () {
		let loginResponse = "Đăng nhập không thành công!";
		let loginStatus = true;
		$scope.errValidate = {
			errUsername: "",
			errPassword: "",
			others: "",
		};

		// validate
		if ($scope.username.length < 5) {
			$scope.errValidate.errUsername = "Tài khoản ít nhất 5 ký tự!";
			loginStatus = false;
		}
		if ($scope.password.length < 6) {
			$scope.errValidate.errPassword = "Mật khẩu ít nhất 6 ký tự!";
			loginStatus = false;
		}

		console.log(loginStatus);

		if (loginStatus) {
			$scope.accountInfor.forEach(function (ele, index) {
				if (ele.username == $scope.username) {
					if (ele.password == $scope.password) {
						loginResponse = "Đăng nhập thành công!";

						sessionStorage.setItem("loginToken", ele.id);
						sessionStorage.setItem("reloadPage", 1);

						var quizTimeByInterval = setInterval(function () {
							sessionStorage.removeItem("loginToken");
							sessionStorage.setItem("reloadPageLogin", 1);

							clearInterval(quizTimeByInterval);
							alert(
								"Hết thời gian đăng nhập. Vui lòng đăng nhập lại!"
							);

							location.href = "#!/login";
						}, 5000);

						alert("Đăng nhập thành công!");
						location.href = "#!/";
					}

					return;
				}
			});

			$scope.errValidate.others = "Tài khoản hoặc mật khẩu nhập sai!";
		}
	};

	// reload page
	let countReload = sessionStorage.getItem("reloadPageLogin");

	if (countReload != "reloaded") {
		location.reload();
		sessionStorage.setItem("reloadPageLogin", "reloaded");
	}
});

myApp.controller(
	"quizController",
	function ($scope, $http, $rootScope, $routeParams) {
		// check user login status
		$scope.userId = sessionStorage.getItem("loginToken");

		if ($scope.userId < 1) {
			return (location.href = "#!/login");
		}

		if ($rootScope.doingQuiz == undefined) {
			location.href = "#!/";
		}

		$rootScope.doingQuiz = true;

		// request inforProgress of user
		$scope.categoryId = $routeParams.categoryId;

		let tableName =
			"/inforProgress?userId=" +
			$scope.userId +
			"&categoryObject.id=" +
			$scope.categoryId;

		$http.get(dbUrl + tableName).then(
			function (response) {
				// assign progress id
				$scope.inforProgress = response.data[0];
			},
			function (response) {
				console.log("Lỗi nhận data từ json!!!");
			}
		);

		// request câu hỏi có categoryId = $routeParams.categoryId
		tableName = "/question?categoryId=";

		$http.get(dbUrl + tableName + $scope.categoryId).then(
			function (response) {
				$scope.showAll = response.data;
				// sort arr question
				$scope.showAll = $scope.showAll.sort(function (a, b) {
					return b.id - a.id;
				});

				// check if request return empty arr
				if ($scope.showAll.length < 1) {
					location.href = "#!/notfound";
				}

				// creat list answer of user
				$scope.questListObject = [];
				for (let i = 0; i < $scope.showAll.length; i++) {
					$scope.questListObject.push({
						questId: $scope.showAll[i].id,
						ansId: -1,
					});
				}

				// create number total question
				$scope.goalProgress = $scope.questListObject.length;
			},
			function (response) {
				alert("Lỗi nhận data từ json!!!");
			}
		);

		$scope.checkCorrectAns = function () {
			$scope.correctQuestion = 0;

			for (
				let index = 0;
				index < $scope.questListObject.length;
				index++
			) {
				if (
					$scope.questListObject[index].ansId ==
					$scope.showAll[index].AnswerId
				) {
					$scope.correctQuestion++;
				}
			}
			$scope.incorrectQuestion =
				$scope.questListObject.length - $scope.correctQuestion;
			$scope.totalPoint =
				($scope.correctQuestion / $scope.incorrectQuestion) * 10; // Hệ số điểm 10
			if ($scope.totalPoint > 0) {
				$scope.totalPoint = (
					Math.round($scope.totalPoint * 100) / 100
				).toFixed(2);
			}
		};

		// set event submit the quiz
		$scope.checkQuizSubmit = function (submitAction = 0) {
			$scope.checkCorrectAns();
			let checkConfirm = false;

			if (submitAction == 1) {
				checkConfirm = confirm(
					"Bạn có chắc chắn muốn nộp bài không?"
				);
			} else {
				alert("Đã hết thời gian làm bài.");
			}

			if (submitAction == 0 || checkConfirm) {
				clearInterval(quizTimeByInterval);

				let dataProgress = {
					id: $scope.inforProgress.id,
					userId: $scope.inforProgress.userId,
					categoryObject: $scope.inforProgress.categoryObject,
					questionDetail: {
						correctQuestion: $scope.correctQuestion,
						incorrectQuestion: $scope.incorrectQuestion,
						totalPoint: $scope.totalPoint,
					},
					timeSpend: countTimeSpendBySecond,
				};

				tableName = "/tempInforProgress/1";
				$http.patch(dbUrl + tableName, dataProgress).then(
					function (response) {
						$rootScope.doingQuiz = false;

						// check if new test have total point higher the past then patch or not
						if (
							$scope.inforProgress.questionDetail
								.totalPoint < $scope.totalPoint
						) {
							tableName =
								"/inforProgress/" +
								$scope.inforProgress.id;
							$http.patch(
								dbUrl + tableName,
								dataProgress
							).then(
								function (response) {},
								function (response) {}
							);
						}

						// direct to result page
						location.href =
							"#!/quiz/quizresult/" +
							$scope.inforProgress.userId +
							"/" +
							$scope.inforProgress.categoryObject.id +
							"#resultShow";
					},
					function (response) {}
				);
			}
		};

		// set period time count down for quiz
		// Set the date we're counting down to unit milisecond (1000 milli = 1ms)
		var countDownDate = new Date().getTime() + 1000 * 60 * 15;
		var countTimeSpendBySecond = 0;
		// Update the count down every 1 second
		var quizTimeByInterval = setInterval(function () {
			if ($rootScope.doingQuiz == true) {
				countTimeSpendBySecond++;

				// Get today's date and time
				var now = new Date().getTime();

				// Find the distance between now and the count down date
				var distance = countDownDate - now;

				// Time calculations for days, hours, minutes and seconds
				// var days = Math.floor(distance / (1000 * 60 * 60 * 24));
				// var hours = Math.floor(
				// 	(distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
				// );
				var minutes = Math.floor(
					(distance % (1000 * 60 * 60)) / (1000 * 60)
				);
				var seconds = Math.floor((distance % (1000 * 60)) / 1000);

				// Output the result in an element with id="demo"
				let displayMinutes = minutes + ":";
				if (minutes <= 0) {
					displayMinutes = "";
				}
				document.getElementById("quizTimeDisplay").innerHTML =
					// days +
					// "d " +
					// hours +
					// "h " +
					displayMinutes + seconds + "s ";

				// If the count down is over, write some text
				if (distance < 0) {
					clearInterval(quizTimeByInterval);
					$scope.checkQuizSubmit();

					document.getElementById("quizTimeDisplay").innerHTML =
						"Time out!!!";

					$rootScope.doingQuiz = false;
				}
			} else {
				clearInterval(quizTimeByInterval);
			}
		}, 1000);

		$scope.lastResult = 0;
		$scope.nowProgress = {
			width: "7%",
		};
		// catch and handle event click on answer
		$scope.saveAns = function (idQuest, idAnswer) {
			// update the ans
			let indexOfQuest = $scope.questListObject.findIndex(function (
				ele
			) {
				return ele.questId == idQuest;
			});
			if (indexOfQuest != -1) {
				$scope.questListObject[indexOfQuest].ansId = idAnswer;
			}

			$scope.lastResult = 0;
			// update infor of progress bar
			$scope.questListObject.filter(function (questions) {
				if (questions.ansId != -1) {
					$scope.lastResult++;
				}
			});
			// update css width of progress bar
			$scope.nowProgressCalculate =
				($scope.lastResult / $scope.goalProgress) * 100;
			if ($scope.nowProgressCalculate > 7) {
				$scope.nowProgress = {
					width: $scope.nowProgressCalculate + "%",
				};
			}
		};

		// after click -> active index clicked
		$scope.itemEachPage = 1;
		$scope.beginPage = 0;
		$scope.paginatingFunc = function (beginn) {
			// when go down out of arr index
			if (beginn < 0) {
				beginn = 0;
			}
			// when go up out of arr index
			if (beginn > $scope.showAll.length - 1) {
				beginn -= $scope.itemEachPage;
			}
			$scope.beginPage = beginn;

			// remove all class active
			let pageIndexLi = document.querySelectorAll(".pageIndexLi");
			pageIndexLi.forEach(function (ele) {
				ele.classList.remove("active");
			});
			$scope.activeIndexPage = null;

			pageIndexLi[beginn / $scope.itemEachPage + 1].classList.toggle(
				"active"
			);
		};

		// before load -> active frist index
		$scope.activeIndexPage = function () {
			let pageIndexLi = document.querySelectorAll(".pageIndexLi");

			if (pageIndexLi[1].nextElementSibling != undefined) {
				return document
					.querySelectorAll(".pageIndexLi")[1]
					.classList.add("active");
			}
		};
	}
);
myApp.controller(
	"viewProfileController",
	function ($scope, $http, $rootScope, $routeParams) {
		console.log(333);

		// check user login status
		$scope.userId = sessionStorage.getItem("loginToken");

		if ($scope.userId < 1) {
			return (location.href = "#!/login");
		}

		// request inforProgress of user
		$scope.categoryId = $routeParams.categoryId;

		let tableName =
			"/inforProgress?userId=" +
			$scope.userId +
			"&categoryObject.id=" +
			$scope.categoryId;

		$http.get(dbUrl + tableName).then(
			function (response) {
				// assign progress id
				$scope.inforProgress = response.data[0];
			},
			function (response) {
				console.log("Lỗi nhận data từ json!!!");
			}
		);

		// request infor account of user
		tableName = "/account/" + $scope.userId;

		$http.get(dbUrl + tableName).then(
			function (response) {
				// assign progress id
				$scope.accountInfor = response.data;
			},
			function (response) {
				console.log("Lỗi nhận data từ json!!!");
			}
		);

		// hidden banner
		sessionStorage.setItem("bannerDisplay", "none");
	}
);

myApp.controller("alertController", function ($scope) {
	window.alert(
		"Quiz bạn chọn hiện chưa có câu hỏi nào, vui lòng quay lại sau nhé."
	);
	location.href = "#!/";
});

myApp.controller(
	"resultController",
	function ($scope, $rootScope, $http, $routeParams) {
		$scope.userId = sessionStorage.getItem("loginToken");

		if ($scope.userId < 1) {
			return (location.href = "#!/login");
		}

		// request inforProgress of user
		$scope.userId = $routeParams.userId;
		$scope.cateId = $routeParams.cateId;

		let tableName = "/tempInforProgress/1";

		$http.get(dbUrl + tableName).then(
			function (response) {
				// assign progress id
				$scope.inforProgress = response.data;
			},
			function (response) {
				console.log("Lỗi nhận data từ json!!!");
			}
		);

		// request infor account of user
		tableName = "/account/" + $scope.userId;

		$http.get(dbUrl + tableName).then(
			function (response) {
				// assign progress id
				$scope.accountInfor = response.data;
			},
			function (response) {
				console.log("Lỗi nhận data từ json!!!");
			}
		);
	}
);
